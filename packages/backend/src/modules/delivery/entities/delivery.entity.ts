import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VehicleType } from '../../logistics/entities/driver.entity';

// Repartidor independiente del marketplace (no empleado de ninguna
// empresa), con login propio -- ver ADR-026. No confundir con `Driver`
// (ADR-019), que es el perfil de un repartidor INTERNO de una empresa
// (CompanyUser con rol Logistica). Reusa el enum VehicleType de logistics
// porque son los mismos 5 tipos de vehiculo.
@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ nullable: true, length: 20 })
  phone: string;

  @Column({ name: 'vehicle_type', type: 'enum', enum: VehicleType })
  vehicleType: VehicleType;

  @Column({ name: 'license_plate', type: 'varchar', length: 10, nullable: true })
  licensePlate: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Reservado para un toggle de disponibilidad futuro (ver ADR-026,
  // seccion "Consecuencias") -- hoy no bloquea nada, siempre arranca true.
  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @Column({ name: 'fcm_token', nullable: true, length: 255 })
  fcmToken: string;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
