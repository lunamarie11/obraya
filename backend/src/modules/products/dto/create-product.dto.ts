import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  brand: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  unit: string;

  @IsString()
  categoryId: string;

  @IsString()
  supplierId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  proPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsBoolean()
  isPromo?: boolean;

  @IsOptional()
  @IsNumber()
  promoPrice?: number;

  @IsOptional()
  @IsString()
  badge?: string;
}
