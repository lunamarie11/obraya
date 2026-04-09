import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Company } from '../../users/entities/company.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ length: 200 })
  name: string;

  @Column({ nullable: true, length: 50 })
  sku: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true, length: 100 })
  category: string;

  @Column({ nullable: true, length: 100 })
  subcategory: string;

  @Column({ nullable: true, length: 100 })
  brand: string;

  // URLs de imágenes en S3/MinIO (máx 10 según spec)
  @Column({ type: 'jsonb', nullable: true })
  images: string[];

  // URL de ficha técnica PDF
  @Column({ name: 'technical_sheet_url', nullable: true, length: 500 })
  technicalSheetUrl: string;

  // Unidad de medida (m2, m3, kg, unidad, etc.)
  @Column({ name: 'unit_of_measure', nullable: true, length: 30 })
  unitOfMeasure: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants: ProductVariant[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
