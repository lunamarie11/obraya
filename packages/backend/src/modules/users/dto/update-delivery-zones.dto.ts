import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FleetType } from '../entities/company.entity';

class DeliveryZoneDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  zipCodes: string[];

  @ApiProperty()
  @IsInt()
  @Min(0)
  promisedHours: number;

  @ApiProperty({ enum: FleetType })
  @IsEnum(FleetType)
  fleetType: FleetType;

  @ApiProperty({ description: 'Centavos de ARS' })
  @IsInt()
  @Min(0)
  shippingCost: number;
}

// Endpoint separado de UpdateCompanyDto: permite que Logistica configure
// zonas de entrega (spec: "Logistica: procesa pedidos y configura
// entregas") sin poder tocar datos bancarios/perfil, que siguen siendo
// Admin-only (ver ADR-016).
export class UpdateDeliveryZonesDto {
  @ApiProperty({ type: [DeliveryZoneDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryZoneDto)
  deliveryZones: DeliveryZoneDto[];
}
