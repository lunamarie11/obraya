import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { parse as csvParse } from 'csv-parse/sync';
import { Stock } from './entities/stock.entity';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { UpdateStockDto, BulkUpdateStockItemDto } from './dto/update-stock.dto';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
    @InjectRepository(StockMovement)
    private readonly movementRepo: Repository<StockMovement>,
    private readonly dataSource: DataSource,
  ) {}

  async findByCompany(companyId: string): Promise<Stock[]> {
    return this.stockRepo
      .createQueryBuilder('stock')
      .innerJoinAndSelect('stock.product', 'product')
      .leftJoinAndSelect('stock.variant', 'variant')
      .where('product.companyId = :companyId', { companyId })
      .andWhere('product.isActive = true')
      .orderBy('product.name', 'ASC')
      .addOrderBy('stock.warehouseName', 'ASC')
      .getMany();
  }

  async findLowStock(companyId: string): Promise<Stock[]> {
    const allStock = await this.findByCompany(companyId);
    return allStock.filter((s) => s.isLowStock);
  }

  async findByProduct(productId: string, companyId: string): Promise<Stock[]> {
    const stocks = await this.stockRepo
      .createQueryBuilder('stock')
      .innerJoin('stock.product', 'product')
      .where('stock.productId = :productId', { productId })
      .andWhere('product.companyId = :companyId', { companyId })
      .getMany();

    if (!stocks.length) {
      // Retornar registro vacío si el producto existe pero no tiene stock registrado
      return [];
    }
    return stocks;
  }

  async updateStock(
    productId: string,
    companyId: string,
    dto: UpdateStockDto,
    userId: string,
  ): Promise<Stock> {
    return this.dataSource.transaction(async (manager) => {
      const stockRepo = manager.getRepository(Stock);
      const movementRepo = manager.getRepository(StockMovement);

      // Verificar que el producto pertenece a la empresa
      const existing = await stockRepo
        .createQueryBuilder('stock')
        .innerJoin('stock.product', 'product')
        .where('stock.productId = :productId', { productId })
        .andWhere('product.companyId = :companyId', { companyId })
        .andWhere('stock.warehouseId = :warehouseId', {
          warehouseId: dto.warehouseId || 'principal',
        })
        .getOne();

      const previousQuantity = existing?.quantity || 0;
      const diff = dto.quantity - previousQuantity;
      const movementType = diff >= 0 ? MovementType.ENTRADA : MovementType.SALIDA;

      let stock: Stock;
      if (existing) {
        Object.assign(existing, {
          quantity: dto.quantity,
          warehouseName: dto.warehouseName || existing.warehouseName,
          minimumAlert: dto.minimumAlert ?? existing.minimumAlert,
          alertEnabled: dto.alertEnabled ?? existing.alertEnabled,
          lastRestockAt: diff > 0 ? new Date() : existing.lastRestockAt,
        });
        stock = await stockRepo.save(existing);
      } else {
        const newStock = stockRepo.create({
          productId,
          warehouseId: dto.warehouseId || 'principal',
          warehouseName: dto.warehouseName || 'Depósito Principal',
          quantity: dto.quantity,
          minimumAlert: dto.minimumAlert ?? 5,
          alertEnabled: dto.alertEnabled ?? true,
        });
        if (dto.quantity > 0) newStock.lastRestockAt = new Date();
        stock = await stockRepo.save(newStock);
      }

      // Registrar movimiento solo si hubo cambio
      if (diff !== 0) {
        await movementRepo.save(
          movementRepo.create({
            stockId: stock.id,
            type: movementType,
            quantity: Math.abs(diff),
            quantityAfter: dto.quantity,
            notes: dto.notes,
            userId,
          }),
        );
      }

      // Log alerta si corresponde
      if (stock.isLowStock) {
        this.logger.warn(
          `BAJO STOCK: productId=${productId} warehouse=${stock.warehouseId} cantidad=${stock.quantity} mínimo=${stock.minimumAlert}`,
        );
      }

      return stock;
    });
  }

  async bulkUpdate(
    companyId: string,
    items: BulkUpdateStockItemDto[],
    userId: string,
  ): Promise<{ updated: number; errors: Array<{ productId: string; error: string }> }> {
    const results = { updated: 0, errors: [] as Array<{ productId: string; error: string }> };

    for (const item of items) {
      try {
        await this.updateStock(
          item.productId,
          companyId,
          {
            quantity: item.quantity,
            warehouseId: item.warehouseId,
            notes: item.notes,
          },
          userId,
        );
        results.updated++;
      } catch (err) {
        results.errors.push({ productId: item.productId, error: err.message });
      }
    }

    return results;
  }

  async bulkUpdateFromCsv(
    companyId: string,
    fileBuffer: Buffer,
    userId: string,
  ): Promise<{ updated: number; errors: Array<{ row: number; error: string }> }> {
    let rows: Record<string, string>[];
    try {
      rows = csvParse(fileBuffer, { columns: true, skip_empty_lines: true, trim: true });
    } catch {
      throw new BadRequestException('El archivo CSV tiene formato inválido');
    }

    const results = { updated: 0, errors: [] as Array<{ row: number; error: string }> };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      if (!row.product_id || !row.quantity) {
        results.errors.push({ row: rowNum, error: 'Se requieren columnas: product_id, quantity' });
        continue;
      }

      const qty = parseInt(row.quantity, 10);
      if (isNaN(qty) || qty < 0) {
        results.errors.push({ row: rowNum, error: 'La cantidad debe ser un número entero >= 0' });
        continue;
      }

      try {
        await this.updateStock(row.product_id, companyId, {
          quantity: qty,
          warehouseId: row.warehouse_id,
          notes: row.notes,
        }, userId);
        results.updated++;
      } catch (err) {
        results.errors.push({ row: rowNum, error: err.message });
      }
    }

    return results;
  }

  async getMovements(
    productId: string,
    companyId: string,
    limit = 50,
  ): Promise<StockMovement[]> {
    return this.movementRepo
      .createQueryBuilder('movement')
      .innerJoin('movement.stock', 'stock')
      .innerJoin('stock.product', 'product')
      .where('stock.productId = :productId', { productId })
      .andWhere('product.companyId = :companyId', { companyId })
      .orderBy('movement.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }
}
