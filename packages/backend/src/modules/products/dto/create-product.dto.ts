import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Length,
  IsArray,
  IsBoolean,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateVariantDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 80)
  skuVariant?: string;

  @ApiPropertyOptional({ example: { color: 'Rojo', tamaño: '60x60' } })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;
}

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 50)
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  subcategory?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 30)
  unitOfMeasure?: string;

  @ApiPropertyOptional({ type: [CreateVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}
