import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

// Espacio publicitario pago (ver ADR-021 y docs/specs/banners-publicitarios.md):
// una empresa (fabricante/distribuidor) paga a ObraYa por aparecer destacada
// en el home del comprador, entre el hero y el buscador. A diferencia de
// PromotionBanner (ver ADR-009), que deriva de un descuento real ya cargado
// en Price sin costo adicional, acá el contenido (title/subtitle/cta) lo
// define el anunciante — por eso sí amerita una entidad propia. El alta de
// banners es manual por ahora (panel admin), sin flujo de pago con
// MercadoPago todavía.
@Entity('sponsored_banners')
export class SponsoredBanner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ length: 80 })
  title: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  subtitle: string | null;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'cta_label', length: 40, default: 'Ver tienda' })
  ctaLabel: string;

  @Column({ name: 'start_date', type: 'timestamptz' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamptz' })
  endDate: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Orden de aparición cuando hay varios banners activos a la vez (mayor
  // primero). No hay licitación/puja automática todavía, lo fija el equipo
  // ObraYa al crear el banner según lo acordado comercialmente.
  @Column({ default: 0 })
  priority: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
