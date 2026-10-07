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

export enum PaymentMethod {
  EFECTIVO      = 'Efectivo',
  TRANSFERENCIA = 'Transferencia',
  MERCADO_PAGO  = 'MercadoPago',
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

  // Repartidor (CompanyUser con rol Logistica) que reclamó este pedido, ver
  // ADR-017 y docs/specs/fase4a-repartidores-asignacion.md. Null = disponible.
  @Column({ name: 'assigned_driver_id', type: 'uuid', nullable: true })
  assignedDriverId: string | null;

  @Column({ name: 'assigned_at', nullable: true })
  assignedAt: Date | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => OrderMessage, (msg) => msg.order, { cascade: true })
  messages: OrderMessage[];

  // Total en centavos de ARS (incluye shippingCost, ver ADR-012)
  @Column({ name: 'total_amount', type: 'bigint' })
  totalAmount: number;

  // Costo de envío en centavos de ARS, resuelto server-side contra las
  // DeliveryZone de la empresa (ver ADR-012). 0 si la empresa no tiene
  // zonas configuradas o el código postal no matchea ninguna.
  @Column({ name: 'shipping_cost', type: 'bigint', default: 0 })
  shippingCost: number;

  @Column({ name: 'shipping_zone_name', nullable: true, length: 100 })
  shippingZoneName: string;

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

  @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod, default: PaymentMethod.EFECTIVO })
  paymentMethod: PaymentMethod;

  // Pago con MercadoPago (ver ADR-007). Nulos si el pedido usa efectivo/transferencia.
  @Column({ name: 'mp_preference_id', nullable: true, length: 100 })
  mpPreferenceId: string;

  @Column({ name: 'mp_payment_id', nullable: true, length: 100 })
  mpPaymentId: string;

  @Column({ name: 'payment_url', nullable: true, type: 'text' })
  paymentUrl: string;

  // Estado crudo que informa MercadoPago (approved, rejected, pending, in_process)
  @Column({ name: 'payment_status', nullable: true, length: 30 })
  paymentStatus: string;

  // Factura electrónica AFIP (ver ADR-010). Se emite al pasar a Despachado;
  // nulos si AFIP no está configurado o el pedido aún no llegó a ese estado.
  @Column({ name: 'afip_cae', nullable: true, length: 20 })
  afipCae: string;

  @Column({ name: 'afip_cae_expiration', nullable: true })
  afipCaeExpiration: Date;

  @Column({ name: 'afip_invoice_number', nullable: true, length: 20 })
  afipInvoiceNumber: string;

  // 'B' | 'C' — nunca 'A' (Buyer no tiene CUIT propio, ver ADR-010)
  @Column({ name: 'afip_invoice_type', nullable: true, length: 5 })
  afipInvoiceType: string;

  // 'emitida' | 'error'
  @Column({ name: 'afip_status', nullable: true, length: 20 })
  afipStatus: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
