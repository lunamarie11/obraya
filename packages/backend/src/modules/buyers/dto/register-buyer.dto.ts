import { IsString, IsEmail, IsNotEmpty, Length, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterBuyerDto {
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

  @ApiPropertyOptional({ description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  @Length(6, 20)
  phone?: string;
}
