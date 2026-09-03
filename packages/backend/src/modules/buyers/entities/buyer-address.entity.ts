import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// Libreta de direcciones del comprador (backlog #3 de marketplace-comprador.md).
// Sin FK dura a Buyer, mismo criterio que Order.buyerId (ver ADR-006): se
// referencia por buyerId (uuid) y se scopea siempre por el JWT del comprador,
// nunca se expone ni se filtra por id de dirección solo.
@Entity('buyer_addresses')
export class BuyerAddress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'buyer_id' })
  buyerId: string;

  @Column({ length: 100, default: 'Casa' })
  label: string;

  @Column({ length: 255 })
  street: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 100 })
  province: string;

  @Column({ name: 'postal_code', length: 20 })
  postalCode: string;

  @Column({ nullable: true, length: 255 })
  notes: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
