import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

// Ultima posicion conocida de un repartidor (CompanyUser con rol Logistica).
// Un solo registro por repartidor (upsert), sin historial/trail — ver
// ADR-018. La visibilidad ("quien aparece en el mapa") se resuelve en
// LogisticsService cruzando esta tabla con pedidos activos, no aca.
@Entity('driver_locations')
export class DriverLocation {
  @PrimaryColumn({ name: 'company_user_id', type: 'uuid' })
  companyUserId: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  lat: number;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  lng: number;

  @Column({ type: 'float', nullable: true })
  accuracy: number | null;

  @Column({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
