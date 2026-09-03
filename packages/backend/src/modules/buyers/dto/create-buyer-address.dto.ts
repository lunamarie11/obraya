import { IsBoolean, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBuyerAddressDto {
  @ApiPropertyOptional({ description: 'Etiqueta de la dirección (Casa, Obra, etc.)' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({ description: 'Calle y número' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ description: 'Ciudad' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'Provincia' })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiProperty({ description: 'Código postal' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiPropertyOptional({ description: 'Piso / Depto / Referencias' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Marcar como dirección predeterminada' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
