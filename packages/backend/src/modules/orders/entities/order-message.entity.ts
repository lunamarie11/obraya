import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

export enum MessageSender {
  COMPANY = 'company', // Fabricante
  BUYER   = 'buyer',   // Comprador
  SYSTEM  = 'system',  // Cambios de estado automáticos
}

@Entity('order_messages')
export class OrderMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'enum', enum: MessageSender })
  sender: MessageSender;

  @Column({ name: 'sender_id', nullable: true, length: 36 })
  senderId: string;

  @Column({ name: 'sender_name', nullable: true, length: 200 })
  senderName: string;

  @Column({ type: 'text' })
  content: string;

  // Mensaje predefinido (para respuestas rápidas, ej: "Tu pedido está listo para despacho")
  @Column({ name: 'is_predefined', default: false })
  isPredefined: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
