import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Stock } from '../stock/entities/stock.entity';

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? '';
          const str = String(val).replace(/"/g, '""');
          return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
        })
        .join(','),
    ),
  ];
  return lines.join('\n');
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
  ) {}

  async salesReportCsv(
    companyId: string,
    from: Date,
    to: Date,
  ): Promise<string> {
    const orders = await this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.companyId = :companyId', { companyId })
      .andWhere('order.status != :cancelled', { cancelled: OrderStatus.CANCELADO })
      .andWhere('order.createdAt BETWEEN :from AND :to', { from, to })
      .orderBy('order.createdAt', 'ASC')
      .getMany();

    const rows: Record<string, unknown>[] = [];

    for (const order of orders) {
      for (const item of order.items) {
        rows.push({
          order_number: order.orderNumber,
          order_date: order.createdAt.toISOString().split('T')[0],
          status: order.status,
          buyer_name: order.buyerName ?? '',
          buyer_email: order.buyerEmail ?? '',
          product_name: item.productName,
          product_sku: item.productSku ?? '',
          quantity: item.quantity,
          unit_price_ars: (item.unitPrice / 100).toFixed(2),
          discount_pct: item.discountPercent,
          subtotal_ars: (Number(item.subtotal) / 100).toFixed(2),
          order_total_ars: (Number(order.totalAmount) / 100).toFixed(2),
          currency: order.currency,
          delivery_date: order.actualDeliveryDate?.toISOString().split('T')[0] ?? '',
        });
      }
    }

    return toCsv(rows);
  }

  async stockReportCsv(companyId: string): Promise<string> {
    const stocks = await this.stockRepo
      .createQueryBuilder('stock')
      .innerJoinAndSelect('stock.product', 'product')
      .leftJoinAndSelect('stock.variant', 'variant')
      .where('product.companyId = :companyId', { companyId })
      .andWhere('product.isActive = true')
      .orderBy('product.name', 'ASC')
      .addOrderBy('stock.warehouseName', 'ASC')
      .getMany();

    const rows = stocks.map((s) => ({
      product_name: s.product.name,
      product_sku: s.product.sku ?? '',
      category: s.product.category ?? '',
      variant_name: s.variant?.name ?? '',
      warehouse: s.warehouseName,
      quantity: s.quantity,
      reserved: s.reservedQuantity,
      available: s.availableQuantity,
      minimum_alert: s.minimumAlert,
      low_stock: s.isLowStock ? 'SI' : 'NO',
      last_restock: s.lastRestockAt?.toISOString().split('T')[0] ?? '',
      updated_at: s.updatedAt.toISOString().split('T')[0],
    }));

    return toCsv(rows);
  }
}
