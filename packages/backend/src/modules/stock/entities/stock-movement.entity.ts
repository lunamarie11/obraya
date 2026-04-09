import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Stock } from './stock.entity';

export enum MovementType {
  ENTRADA = 'entrada',       // Reposición de stock
  SALIDA = 'salida',         // Venta / consumo
  RESERVA = 'reserva',       // Pedido confirmado
  LIBERACION = 'liberacion', // Pedido cancelado
  AJUSTE = 'ajuste',         // Corrección manual
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'stock_id' })
  stockId: string;

  @ManyToOne(() => Stock, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;

  @Column({ type: 'enum', enum: MovementType })
  type: MovementType;

  @Column({ type: 'int' })
  quantity: number;

  // Cantidad resultante después del movimiento
  @Column({ name: 'quantity_after', type: 'int' })
  quantityAfter: number;

  @Column({ nullable: true, length: 300 })
  notes: string;

  // Referencia al pedido que originó el movimiento (si aplica)
  @Column({ name: 'order_id', nullable: true, length: 36 })
  orderId: string;

  // Usuario que realizó el movimiento
  @Column({ name: 'user_id', nullable: true, length: 36 })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
