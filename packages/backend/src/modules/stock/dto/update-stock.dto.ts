import { IsInt, IsOptional, IsString, IsBoolean, Min, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStockDto {
  @ApiProperty({ description: 'Nueva cantidad absoluta en stock' })
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ description: 'ID del depósito', default: 'principal' })
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseName?: string;

  @ApiPropertyOptional({ description: 'Cantidad mínima para alertar' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minimumAlert?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  alertEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Notas del movimiento' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkUpdateStockItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
