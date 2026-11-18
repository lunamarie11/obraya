import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

// Ultima posicion conocida de un repartidor independiente (entidad Delivery,
// ADR-026) -- espejo de driver_locations (ADR-018), pero para la identidad
// sin empresa. Se separa en dos tablas en vez de una polimorfica unica,
// mismo criterio que ya uso ADR-026 con assignedDriverId/assignedDeliveryId
// en paralelo. Ver ADR-027 y docs/specs/fase4e-tracking-google-maps.md.
@Entity('delivery_locations')
export class DeliveryLocation {
  @PrimaryColumn({ name: 'delivery_id', type: 'uuid' })
  deliveryId: string;

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
