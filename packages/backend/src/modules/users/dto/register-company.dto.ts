import {
  IsString,
  IsEmail,
  IsNotEmpty,
  Length,
  Matches,
  IsOptional,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterCompanyDto {
  @ApiProperty({ description: 'CUIT sin guiones (11 dígitos)', example: '30500010912' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11, { message: 'El CUIT debe tener exactamente 11 dígitos' })
  @Matches(/^\d{11}$/, { message: 'El CUIT debe contener solo números' })
  cuit: string;

  @ApiProperty({ description: 'Razón social de la empresa', example: 'Cerámicas del Sur S.A.' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 200)
  razonSocial: string;

  @ApiProperty({ description: 'Email de contacto de la empresa' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  @Length(6, 20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Ciudad' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  city?: string;

  @ApiPropertyOptional({ description: 'Provincia', example: 'Buenos Aires' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  province?: string;

  // Usuario administrador inicial de la empresa
  @ApiProperty({ description: 'Email del usuario administrador' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ description: 'Nombre del administrador' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  adminFirstName: string;

  @ApiProperty({ description: 'Apellido del administrador' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  adminLastName: string;

  @ApiProperty({ description: 'Contraseña (mínimo 8 caracteres)' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  adminPassword: string;
}
