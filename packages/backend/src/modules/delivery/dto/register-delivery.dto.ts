import { IsString, IsEmail, IsNotEmpty, Length, IsOptional, MinLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '../../logistics/entities/driver.entity';

export class RegisterDeliveryDto {
  @ApiProperty({ description: 'Nombre' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  firstName: string;

  @ApiProperty({ description: 'Apellido' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  lastName: string;

  @ApiProperty({ description: 'Email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contraseña (mínimo 8 caracteres)' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @ApiProperty({ description: 'Teléfono de contacto' })
  @IsString()
  @Length(6, 20)
  phone: string;

  @ApiProperty({ description: 'Tipo de vehículo', enum: VehicleType })
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @ApiPropertyOptional({ description: 'Patente (si el vehículo la tiene)' })
  @IsOptional()
  @IsString()
  @Length(1, 10)
  licensePlate?: string;
}
