import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity('stock')
@Index(['productId', 'variantId', 'warehouseId'], { unique: true })
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'variant_id', nullable: true })
  variantId: string;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  // Identificador del depósito/sucursal (por ahora string, en v2 será entidad Warehouse)
  @Column({ name: 'warehouse_id', length: 100, default: 'principal' })
  warehouseId: string;

  @Column({ name: 'warehouse_name', length: 100, default: 'Depósito Principal' })
  warehouseName: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  // Cantidad reservada por pedidos confirmados pero no despachados
  @Column({ name: 'reserved_quantity', type: 'int', default: 0 })
  reservedQuantity: number;

  // Umbral de alerta de bajo stock (configurable por producto)
  @Column({ name: 'minimum_alert', type: 'int', default: 5 })
  minimumAlert: number;

  @Column({ name: 'alert_enabled', default: true })
  alertEnabled: boolean;

  @Column({ name: 'last_restock_at', nullable: true })
  lastRestockAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  get availableQuantity(): number {
    return Math.max(0, this.quantity - this.reservedQuantity);
  }

  get isLowStock(): boolean {
    return this.alertEnabled && this.availableQuantity <= this.minimumAlert;
  }
}
