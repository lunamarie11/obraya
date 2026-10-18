import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

// Ver docs/specs/fase4c-entidad-driver.md: perfil 1:1 de un CompanyUser con
// rol Logistica, no una identidad separada (mismo criterio que
// DriverLocation, PK = companyUserId). Creacion perezosa: no existe fila
// hasta que el repartidor guarda su perfil o togglea disponibilidad por
// primera vez.
export enum VehicleType {
  MOTO = 'Moto',
  AUTO = 'Auto',
  CAMIONETA = 'Camioneta',
  BICICLETA = 'Bicicleta',
  A_PIE = 'APie',
}

@Entity('drivers')
export class Driver {
  @PrimaryColumn({ name: 'company_user_id', type: 'uuid' })
  companyUserId: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'vehicle_type', type: 'enum', enum: VehicleType, nullable: true })
  vehicleType: VehicleType | null;

  @Column({ name: 'license_plate', length: 10, nullable: true })
  licensePlate: string | null;

  @Column({ length: 20, nullable: true })
  phone: string | null;

  // "Disponible para recibir pedidos". Default true para no bloquear a
  // nadie con la migracion (ver spec); bloquea POST /orders/:id/claim
  // cuando esta en false (ver OrdersService.claimOrder).
  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
