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

export enum PriceType {
  B2C = 'B2C', // Consumidor final (con IVA)
  B2B = 'B2B', // Mayorista (sin IVA)
}

export interface VolumePrice {
  minQuantity: number;
  discountPercent: number; // ej: 10 = 10% de descuento
}

export interface ScheduledDiscount {
  discountPercent: number;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  label?: string;    // ej: "Promo Invierno"
}

@Entity('prices')
@Index(['productId', 'variantId', 'type'], { unique: true })
export class Price {
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

  @Column({ type: 'enum', enum: PriceType })
  type: PriceType;

  // Precio base en ARS (centavos para evitar decimales flotantes)
  @Column({ name: 'base_price', type: 'bigint' })
  basePrice: number;

  @Column({ length: 3, default: 'ARS' })
  currency: string;

  // Precios por volumen: [{ minQuantity: 10, discountPercent: 5 }, { minQuantity: 100, discountPercent: 10 }]
  @Column({ name: 'volume_prices', type: 'jsonb', nullable: true })
  volumePrices: VolumePrice[];

  // Descuento programado (fechas)
  @Column({ name: 'scheduled_discount', type: 'jsonb', nullable: true })
  scheduledDiscount: ScheduledDiscount;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
