import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CompanyUser } from './company-user.entity';

export enum CompanyStatus {
  PENDING = 'pending',     // Esperando aprobación manual por ObraYa
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 11 })
  cuit: string;

  @Column({ name: 'razon_social', length: 200 })
  razonSocial: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column({ nullable: true, length: 20 })
  phone: string;

  @Column({ nullable: true, name: 'logo_url', length: 500 })
  logoUrl: string;

  @Column({
    type: 'enum',
    enum: CompanyStatus,
    default: CompanyStatus.PENDING,
  })
  status: CompanyStatus;

  // Datos bancarios (encriptados en v2, por ahora JSON)
  @Column({ name: 'banking_data', type: 'jsonb', nullable: true })
  bankingData: {
    cbu?: string;
    alias?: string;
    bank?: string;
    accountHolder?: string;
  };

  // Zonas de cobertura por código postal
  @Column({ name: 'coverage_zones', type: 'jsonb', nullable: true })
  coverageZones: string[];

  @Column({ nullable: true, length: 300 })
  address: string;

  @Column({ nullable: true, length: 100 })
  city: string;

  @Column({ nullable: true, length: 100 })
  province: string;

  // Fecha de aprobación manual por equipo ObraYa
  @Column({ name: 'approved_at', nullable: true })
  approvedAt: Date;

  @Column({ name: 'approved_by', nullable: true, length: 100 })
  approvedBy: string;

  @OneToMany(() => CompanyUser, (user) => user.company)
  users: CompanyUser[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
