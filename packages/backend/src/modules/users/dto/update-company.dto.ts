import { IsString, IsOptional, Length, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class BankingDataDto {
  @ApiPropertyOptional({ description: 'CBU (22 dígitos)' })
  @IsOptional()
  @IsString()
  @Length(0, 22)
  cbu?: string;

  @ApiPropertyOptional({ description: 'Alias de CBU' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  alias?: string;

  @ApiPropertyOptional({ description: 'Banco' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  bank?: string;

  @ApiPropertyOptional({ description: 'Titular de la cuenta' })
  @IsOptional()
  @IsString()
  @Length(0, 150)
  accountHolder?: string;
}

// Datos de perfil y bancarios de la empresa. No incluye deliveryZones: eso
// se gestiona por un endpoint separado con permisos distintos (ver
// UpdateDeliveryZonesDto), porque Logistica puede configurar zonas de
// entrega pero no debe poder tocar datos bancarios (ver ADR-016).
export class UpdateCompanyDto {
  @ApiPropertyOptional({ description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Dirección' })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  address?: string;

  @ApiPropertyOptional({ description: 'Ciudad' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  city?: string;

  @ApiPropertyOptional({ description: 'Provincia' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  province?: string;

  @ApiPropertyOptional({ description: 'Datos bancarios de la empresa' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BankingDataDto)
  bankingData?: BankingDataDto;
}
