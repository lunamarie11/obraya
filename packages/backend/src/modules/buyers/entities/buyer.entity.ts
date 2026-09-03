import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// Comprador final del marketplace (particular, constructora, profesional).
// Desacoplado de CompanyUser (usuarios de empresa/fabricante) — ver ADR-006.
@Entity('buyers')
export class Buyer {
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

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
