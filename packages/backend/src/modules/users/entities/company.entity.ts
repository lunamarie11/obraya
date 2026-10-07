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

// Condición frente al IVA del fabricante/vendedor. Determina el tipo de
// factura electrónica que se emite (ver ADR-010): Responsable Inscripto
// factura Factura B, Monotributo/Exento facturan Factura C. Como los
// compradores (Buyer) no tienen CUIT propio, nunca se emite Factura A.
export enum CompanyIvaCondition {
  RESPONSABLE_INSCRIPTO = 'RI',
  MONOTRIBUTO = 'MONOTRIBUTO',
  EXENTO = 'EXENTO',
}

// Ver spec MVP-backoffice-fabricantes.md, punto 8 "Configuracion Logistica".
export enum FleetType {
  PROPIA = 'propia',
  TERCERIZADA = 'tercerizada',
  RETIRO_LOCAL = 'retiro_local',
}

export interface DeliveryZone {
  id: string;
  name: string;
  // Códigos postales cubiertos por esta zona (match exacto, ver resolveDeliveryZone).
  zipCodes: string[];
  promisedHours: number;
  fleetType: FleetType;
  // Costo de envío en centavos de ARS, igual convención que Order.totalAmount.
  shippingCost: number;
}

// Resuelve la zona de entrega para un código postal dado. Match exacto sobre
// zipCodes (sin geocoding/polígonos, ver limitación conocida en ADR-012).
// Si la empresa no configuró zonas, o el código postal no matchea ninguna,
// devuelve null: el checkout no bloquea, solo no puede cotizar el envío.
export function resolveDeliveryZone(
  zones: DeliveryZone[] | null | undefined,
  postalCode: string | null | undefined,
): DeliveryZone | null {
  if (!zones?.length || !postalCode) return null;
  const normalized = postalCode.trim().toUpperCase();
  return zones.find((zone) => zone.zipCodes.some((zip) => zip.trim().toUpperCase() === normalized)) ?? null;
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

  @Column({
    name: 'iva_condition',
    type: 'enum',
    enum: CompanyIvaCondition,
    default: CompanyIvaCondition.RESPONSABLE_INSCRIPTO,
  })
  ivaCondition: CompanyIvaCondition;

  // Datos bancarios (encriptados en v2, por ahora JSON)
  @Column({ name: 'banking_data', type: 'jsonb', nullable: true })
  bankingData: {
    cbu?: string;
    alias?: string;
    bank?: string;
    accountHolder?: string;
  };

  // Zonas de entrega configuradas (ver DeliveryZone arriba). Reemplaza al viejo
  // `coverageZones: string[]` (solo códigos postales, sin costo/tiempo/flota).
  @Column({ name: 'delivery_zones', type: 'jsonb', nullable: true })
  deliveryZones: DeliveryZone[];

  // Derivado de deliveryZones: lista plana de códigos postales cubiertos, para
  // los componentes que solo necesitan "cuántas zonas cubre" (StoreCard ETA
  // placeholder). No se persiste.
  get coverageZones(): string[] {
    return (this.deliveryZones ?? []).flatMap((z) => z.zipCodes);
  }

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

  // Comisión del repartidor sobre el shippingCost del pedido, en porcentaje
  // entero (0-100). Reemplaza el `COMMISSION = 0.08` hardcodeado del frontend
  // de reparto (ver ADR-017).
  @Column({ name: 'driver_commission_percent', type: 'int', default: 8 })
  driverCommissionPercent: number;

  @OneToMany(() => CompanyUser, (user) => user.company)
  users: CompanyUser[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
