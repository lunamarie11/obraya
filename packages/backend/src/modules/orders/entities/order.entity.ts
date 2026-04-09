import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from '../../users/entities/company.entity';
import { OrderItem } from './order-item.entity';
import { OrderMessage } from './order-message.entity';

export enum OrderStatus {
  NUEVO       = 'Nuevo',
  ACEPTADO    = 'Aceptado',
  PREPARACION = 'Preparacion',
  DESPACHADO  = 'Despachado',
  ENTREGADO   = 'Entregado',
  CANCELADO   = 'Cancelado',
}

// Transiciones de estado válidas (spec: Nuevo→Aceptado→Preparacion→Despachado→Entregado)
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.NUEVO]:       [OrderStatus.ACEPTADO, OrderStatus.CANCELADO],
  [OrderStatus.ACEPTADO]:    [OrderStatus.PREPARACION, OrderStatus.CANCELADO],
  [OrderStatus.PREPARACION]: [OrderStatus.DESPACHADO, OrderStatus.CANCELADO],
  [OrderStatus.DESPACHADO]:  [OrderStatus.ENTREGADO],
  [OrderStatus.ENTREGADO]:   [],
  [OrderStatus.CANCELADO]:   [],
};

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  // ID del comprador (usuario del marketplace, entidad Buyer en Fase 2)
  @Column({ name: 'buyer_id', length: 36 })
  buyerId: string;

  @Column({ name: 'buyer_name', length: 200, nullable: true })
  buyerName: string;

  @Column({ name: 'buyer_email', length: 150, nullable: true })
  buyerEmail: string;

  @Column({ name: 'buyer_phone', length: 20, nullable: true })
  buyerPhone: string;

  @Index()
  @Column({ name: 'order_number', unique: true, length: 20 })
  orderNumber: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.NUEVO })
  status: OrderStatus;

  @Column({ name: 'rejection_reason', nullable: true, length: 500 })
  rejectionReason: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => OrderMessage, (msg) => msg.order, { cascade: true })
  messages: OrderMessage[];

  // Total en centavos de ARS
  @Column({ name: 'total_amount', type: 'bigint' })
  totalAmount: number;

  @Column({ length: 3, default: 'ARS' })
  currency: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  // Dirección de entrega
  @Column({ name: 'delivery_address', type: 'jsonb', nullable: true })
  deliveryAddress: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    notes?: string;
  };

  @Column({ name: 'scheduled_delivery_date', nullable: true })
  scheduledDeliveryDate: Date;

  @Column({ name: 'actual_delivery_date', nullable: true })
  actualDeliveryDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
