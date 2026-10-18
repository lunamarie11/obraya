import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '../entities/driver.entity';

export class UpdateDriverProfileDto {
  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ description: 'Patente del vehiculo' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  licensePlate?: string;

  @ApiPropertyOptional({ description: 'Telefono de contacto del repartidor' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}
