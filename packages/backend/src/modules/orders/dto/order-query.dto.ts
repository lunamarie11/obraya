import { IsOptional, IsEnum, IsString, IsInt, Min, Max, IsDateString, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../entities/order.entity';

export class OrderQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Buscar por número de orden o nombre del comprador' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Fecha desde (ISO)', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Fecha hasta (ISO)', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  // Ver ADR-017: cola de reparto separada en "disponibles" vs "mis pedidos".
  @ApiPropertyOptional({ description: 'Solo pedidos Despachado sin repartidor asignado' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unassigned?: boolean;

  @ApiPropertyOptional({ description: 'Solo pedidos asignados al repartidor autenticado' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  assignedToMe?: boolean;
}
