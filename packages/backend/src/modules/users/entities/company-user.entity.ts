import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from './company.entity';

export enum UserRole {
  SUPER_ADMIN = 'SuperAdmin',
  ADMIN = 'Admin',
  VENDEDOR = 'Vendedor',
  LOGISTICA = 'Logistica',
  CONTABILIDAD = 'Contabilidad',
}

@Entity('company_users')
export class CompanyUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.users)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VENDEDOR,
  })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Permisos granulares por sección (para v2, por ahora el rol define todo)
  @Column({ type: 'jsonb', nullable: true })
  permissions: Record<string, boolean>;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt: Date;

  // Token de invitación por email (se limpia al aceptar)
  @Column({ name: 'invite_token', nullable: true, length: 255 })
  inviteToken: string;

  @Column({ name: 'invite_expires_at', nullable: true })
  inviteExpiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
