import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PriceType } from '../entities/price.entity';

class VolumePriceDto {
  @ApiProperty({ description: 'Cantidad mínima para aplicar el descuento', example: 10 })
  @IsInt()
  @Min(1)
  minQuantity: number;

  @ApiProperty({ description: 'Porcentaje de descuento (1-100)', example: 5 })
  @IsNumber()
  @Min(0.01)
  @Max(100)
  discountPercent: number;
}

class ScheduledDiscountDto {
  @ApiProperty({ example: 15 })
  @IsNumber()
  @Min(0.01)
  @Max(100)
  discountPercent: number;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-06-30' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: 'Promo Invierno' })
  @IsOptional()
  @IsString()
  label?: string;
}

export class SetPriceDto {
  @ApiProperty({ enum: PriceType, description: 'B2C = con IVA, B2B = sin IVA' })
  @IsEnum(PriceType)
  type: PriceType;

  @ApiProperty({ description: 'Precio en centavos de ARS (ej: $1500 → 150000)', example: 150000 })
  @IsInt()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({ description: 'Moneda', default: 'ARS' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ type: [VolumePriceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VolumePriceDto)
  volumePrices?: VolumePriceDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ScheduledDiscountDto)
  scheduledDiscount?: ScheduledDiscountDto;

  @ApiPropertyOptional({ description: 'ID de variante (si aplica)' })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiPropertyOptional({ description: 'Motivo del cambio de precio (queda en historial)' })
  @IsOptional()
  @IsString()
  reason?: string;
}
