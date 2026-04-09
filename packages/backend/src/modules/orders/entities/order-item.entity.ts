import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'product_id', length: 36 })
  productId: string;

  @Column({ name: 'variant_id', nullable: true, length: 36 })
  variantId: string;

  @Column({ name: 'product_name', length: 200 })
  productName: string;

  @Column({ name: 'product_sku', nullable: true, length: 50 })
  productSku: string;

  @Column({ type: 'int' })
  quantity: number;

  // Precio unitario en centavos (snapshot al momento del pedido)
  @Column({ name: 'unit_price', type: 'bigint' })
  unitPrice: number;

  // Subtotal = quantity * unitPrice con descuento aplicado
  @Column({ type: 'bigint' })
  subtotal: number;

  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercent: number;

  @Column({ nullable: true, length: 300 })
  notes: string;
}
