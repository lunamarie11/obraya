import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

// Reseña de un comprador sobre un pedido entregado (backlog #6 marketplace-comprador.md).
// Sin FK dura a Buyer/Order/Company, mismo criterio que BuyerFavorite/BuyerAddress/Order
// (ver ADR-006): se referencia por id y se valida en el service. Un pedido admite como
// máximo una reseña (orderId único) y solo puede calificarlo el comprador dueño del
// pedido una vez que llegó a estado Entregado (ver ReviewsService.create).
@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'buyer_id' })
  buyerId: string;

  @Index()
  @Column({ name: 'company_id' })
  companyId: string;

  @Column({ name: 'order_id', unique: true })
  orderId: string;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
