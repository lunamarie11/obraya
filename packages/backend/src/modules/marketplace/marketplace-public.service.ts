import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Company, CompanyStatus } from '../users/entities/company.entity';
import { Product } from '../products/entities/product.entity';
import { Stock } from '../stock/entities/stock.entity';
import { PricesService } from '../prices/prices.service';
import { PriceType } from '../prices/entities/price.entity';
import { PublicProductQueryDto } from './dto/public-product-query.dto';

// Endpoint de solo lectura, sin JWT (ver docs/adrs/ADR-003-endpoint-publico-marketplace.md).
// Nunca expone campos que no existan ya en las entidades: rating/ETA se calculan
// como placeholders en el frontend, no acá.

@Injectable()
export class MarketplacePublicService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
    private readonly pricesService: PricesService,
  ) {}

  private toPublicCompany(company: Company) {
    return {
      id: company.id,
      razonSocial: company.razonSocial,
      logoUrl: company.logoUrl,
      city: company.city,
      province: company.province,
      coverageZones: company.coverageZones,
    };
  }

  async findActiveCompanies() {
    const companies = await this.companyRepo.find({
      where: { status: CompanyStatus.ACTIVE },
      order: { razonSocial: 'ASC' },
    });
    return companies.map((c) => this.toPublicCompany(c));
  }

  async findActiveCompany(id: string) {
    const company = await this.companyRepo.findOne({
      where: { id, status: CompanyStatus.ACTIVE },
    });
    if (!company) throw new NotFoundException('Empresa no encontrada');
    return this.toPublicCompany(company);
  }

  private async attachPrice(
    product: Product,
    companyName?: string,
    opts?: { variantId?: string; quantity?: number },
  ) {
    const resolved = await this.pricesService.resolve(
      product.id,
      PriceType.B2C,
      opts?.quantity ?? 1,
      opts?.variantId,
    );
    return {
      id: product.id,
      companyId: product.companyId,
      companyName,
      name: product.name,
      category: product.category,
      images: product.images,
      price: resolved
        ? {
            basePrice: resolved.basePrice,
            finalPrice: resolved.finalPrice,
            discountPercent: resolved.discountPercent,
          }
        : undefined,
    };
  }

  async findCompanyProducts(companyId: string, query: PublicProductQueryDto) {
    const company = await this.findActiveCompany(companyId);

    const where: any = { companyId, isActive: true };
    if (query.category) where.category = query.category;

    const [products, total] = await this.productRepo.findAndCount({
      where: query.search
        ? [
            { ...where, name: Like(`%${query.search}%`) },
            { ...where, sku: Like(`%${query.search}%`) },
          ]
        : where,
      relations: ['variants'],
      skip: ((query.page ?? 1) - 1) * (query.limit ?? 20),
      take: query.limit ?? 20,
      order: { createdAt: 'DESC' },
    });

    return {
      data: await Promise.all(products.map((p) => this.attachPrice(p, company.razonSocial))),
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      totalPages: Math.ceil(total / (query.limit ?? 20)),
    };
  }

  // Búsqueda/listado cruzando todas las empresas activas (equivalente al "buscar
  // en todos los fabricantes" de Rappi). A diferencia de findCompanyProducts,
  // acá se necesita el join con Company para filtrar por status = ACTIVE.
  async findAllProducts(query: PublicProductQueryDto) {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .innerJoinAndSelect('product.company', 'company')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('product.isActive = true')
      .andWhere('company.status = :status', { status: CompanyStatus.ACTIVE });

    if (query.category) qb.andWhere('product.category = :category', { category: query.category });
    if (query.search) {
      qb.andWhere('(product.name ILIKE :search OR product.sku ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [products, total] = await qb
      .orderBy('product.createdAt', 'DESC')
      .skip(((query.page ?? 1) - 1) * (query.limit ?? 20))
      .take(query.limit ?? 20)
      .getManyAndCount();

    return {
      data: await Promise.all(products.map((p) => this.attachPrice(p, p.company?.razonSocial))),
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      totalPages: Math.ceil(total / (query.limit ?? 20)),
    };
  }

  // GET /stock/:productId (módulo Stock) scopea por companyId del JWT — pensado
  // para que cada empresa vea solo su propio inventario. Reutilizarlo tal cual
  // desde el detalle público rompía el flujo de compra: un usuario logueado
  // (staff de OTRA empresa) veía "sin stock" en cualquier producto ajeno,
  // aunque sí tuviera stock real. Acá se agrega la única suma que hace falta
  // (sin exponer depósitos/alertas internas) para que funcione igual logueado
  // o anónimo.
  private async getAvailableStock(productId: string, variantId?: string): Promise<number> {
    const where: any = { productId };
    if (variantId) where.variantId = variantId;
    const rows = await this.stockRepo.find({ where });
    return rows.reduce((sum, s) => sum + Math.max(0, s.quantity - s.reservedQuantity), 0);
  }

  async findPublicProduct(id: string, opts?: { variantId?: string; quantity?: number }) {
    const product = await this.productRepo.findOne({
      where: { id, isActive: true },
      relations: ['variants', 'company'],
    });
    if (!product || product.company?.status !== CompanyStatus.ACTIVE) {
      throw new NotFoundException('Producto no encontrado');
    }
    const companyName = product.company?.razonSocial;
    const { company, ...rest } = product;
    return {
      ...(await this.attachPrice(rest as Product, companyName, opts)),
      variants: product.variants,
      availableStock: await this.getAvailableStock(id, opts?.variantId),
    };
  }
}
