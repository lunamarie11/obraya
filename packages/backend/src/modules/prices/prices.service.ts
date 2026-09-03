import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Price, PriceType } from './entities/price.entity';
import { PriceHistory } from './entities/price-history.entity';
import { SetPriceDto } from './dto/set-price.dto';

export interface ResolvedPrice {
  basePrice: number;           // precio base en centavos
  finalPrice: number;          // precio final aplicando descuentos
  currency: string;
  discountPercent: number;     // descuento total aplicado
  discountSource: 'none' | 'volume' | 'scheduled';
  type: PriceType;
}

@Injectable()
export class PricesService {
  constructor(
    @InjectRepository(Price)
    private readonly priceRepo: Repository<Price>,
    @InjectRepository(PriceHistory)
    private readonly historyRepo: Repository<PriceHistory>,
    private readonly dataSource: DataSource,
  ) {}

  async findByProduct(productId: string, companyId: string): Promise<Price[]> {
    return this.priceRepo
      .createQueryBuilder('price')
      .innerJoin('price.product', 'product')
      .where('price.productId = :productId', { productId })
      .andWhere('product.companyId = :companyId', { companyId })
      .andWhere('price.isActive = true')
      .getMany();
  }

  async setPrice(productId: string, companyId: string, dto: SetPriceDto, userId: string): Promise<Price> {
    return this.dataSource.transaction(async (manager) => {
      const priceRepo = manager.getRepository(Price);
      const historyRepo = manager.getRepository(PriceHistory);

      // Verificar que el producto pertenece a la empresa
      const existing = await priceRepo
        .createQueryBuilder('price')
        .innerJoin('price.product', 'product')
        .where('price.productId = :productId', { productId })
        .andWhere('product.companyId = :companyId', { companyId })
        .andWhere('price.type = :type', { type: dto.type })
        .andWhere(dto.variantId ? 'price.variantId = :variantId' : 'price.variantId IS NULL', {
          variantId: dto.variantId,
        })
        .getOne();

      if (existing) {
        // Guardar historial antes de actualizar
        if (existing.basePrice !== dto.basePrice) {
          await historyRepo.save(
            historyRepo.create({
              priceId: existing.id,
              previousPrice: existing.basePrice,
              newPrice: dto.basePrice,
              currency: dto.currency ?? existing.currency,
              changedBy: userId,
              reason: dto.reason,
            }),
          );
        }

        Object.assign(existing, {
          basePrice: dto.basePrice,
          currency: dto.currency ?? existing.currency,
          volumePrices: dto.volumePrices ?? existing.volumePrices,
          scheduledDiscount: dto.scheduledDiscount ?? existing.scheduledDiscount,
        });
        return priceRepo.save(existing);
      }

      // Crear precio nuevo
      return priceRepo.save(
        priceRepo.create({
          productId,
          variantId: dto.variantId,
          type: dto.type,
          basePrice: dto.basePrice,
          currency: dto.currency ?? 'ARS',
          volumePrices: dto.volumePrices,
          scheduledDiscount: dto.scheduledDiscount,
        }),
      );
    });
  }

  async resolve(productId: string, type: PriceType, quantity = 1, variantId?: string): Promise<ResolvedPrice | null> {
    // Priorizar precio asociado a la variante si se provee
    let price: Price | null = null;
    if (variantId) {
      price = await this.priceRepo.findOne({
        where: { productId, type, variantId, isActive: true },
      });
    }

    if (!price) {
      price = await this.priceRepo.findOne({
        where: { productId, type, isActive: true },
      });
    }

    if (!price) return null;

    const now = new Date();
    let discountPercent = 0;
    let discountSource: ResolvedPrice['discountSource'] = 'none';

    // 1. Descuento programado (tiene precedencia sobre volumen)
    if (price.scheduledDiscount) {
      const start = new Date(price.scheduledDiscount.startDate);
      const end = new Date(price.scheduledDiscount.endDate);
      if (now >= start && now <= end) {
        discountPercent = price.scheduledDiscount.discountPercent;
        discountSource = 'scheduled';
      }
    }

    // 2. Descuento por volumen (si no hay programado activo)
    if (discountSource === 'none' && price.volumePrices?.length && quantity > 1) {
      const applicable = price.volumePrices
        .filter((v) => quantity >= v.minQuantity)
        .sort((a, b) => b.minQuantity - a.minQuantity);

      if (applicable.length) {
        discountPercent = applicable[0].discountPercent;
        discountSource = 'volume';
      }
    }

    const finalPrice = Math.round(price.basePrice * (1 - discountPercent / 100));

    return {
      basePrice: price.basePrice,
      finalPrice,
      currency: price.currency,
      discountPercent,
      discountSource,
      type,
    };
  }

  async getHistory(productId: string, companyId: string): Promise<PriceHistory[]> {
    return this.historyRepo
      .createQueryBuilder('history')
      .innerJoin('history.price', 'price')
      .innerJoin('price.product', 'product')
      .where('price.productId = :productId', { productId })
      .andWhere('product.companyId = :companyId', { companyId })
      .orderBy('history.createdAt', 'DESC')
      .take(100)
      .getMany();
  }
}
