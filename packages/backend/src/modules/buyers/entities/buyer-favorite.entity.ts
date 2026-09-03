import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export type BuyerFavoriteType = 'product' | 'company';

// Favoritos del comprador (backlog #4 de marketplace-comprador.md). Sin FK
// dura, mismo criterio que BuyerAddress/Order (ver ADR-006): se referencia
// por buyerId y targetId (productId o companyId según `type`), siempre
// scopeado por el JWT del comprador. Índice único evita duplicados del mismo
// target para un mismo buyer.
@Entity('buyer_favorites')
@Index(['buyerId', 'type', 'targetId'], { unique: true })
export class BuyerFavorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'buyer_id' })
  buyerId: string;

  @Column({ type: 'varchar', length: 20 })
  type: BuyerFavoriteType;

  @Column({ name: 'target_id' })
  targetId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
