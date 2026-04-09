import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Price } from './price.entity';

@Entity('price_history')
export class PriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'price_id' })
  priceId: string;

  @ManyToOne(() => Price, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'price_id' })
  price: Price;

  @Column({ name: 'previous_price', type: 'bigint' })
  previousPrice: number;

  @Column({ name: 'new_price', type: 'bigint' })
  newPrice: number;

  @Column({ length: 3, default: 'ARS' })
  currency: string;

  @Column({ name: 'changed_by', nullable: true, length: 36 })
  changedBy: string;

  @Column({ nullable: true, length: 200 })
  reason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
