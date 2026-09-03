import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested, IsNumber, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class OrderDeliveryAddressDto {
  @ApiProperty({ description: 'Calle y número' })
  @IsString()
  street: string;

  @ApiProperty({ description: 'Ciudad' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Provincia' })
  @IsString()
  province: string;

  @ApiProperty({ description: 'Código postal' })
  @IsString()
  postalCode: string;

  @ApiPropertyOptional({ description: 'Notas adicionales de entrega' })
  @IsOptional()
  @IsString()
  notes?: string;
}

class OrderItemDto {
  @ApiProperty({ description: 'ID del producto' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ description: 'ID de la variante' })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty({ description: 'Nombre del producto' })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiPropertyOptional({ description: 'SKU del producto' })
  @IsOptional()
  @IsString()
  productSku?: string;

  @ApiProperty({ description: 'Cantidad solicitada' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Precio unitario en centavos' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Porcentaje de descuento aplicado' })
  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Notas del item' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'ID del fabricante/empresa vendedora' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ description: 'Nombre del comprador' })
  @IsString()
  @IsNotEmpty()
  buyerName: string;

  @ApiProperty({ description: 'Email del comprador' })
  @IsString()
  @IsNotEmpty()
  buyerEmail: string;

  @ApiPropertyOptional({ description: 'Teléfono del comprador' })
  @IsOptional()
  @IsString()
  buyerPhone?: string;

  @ApiPropertyOptional({ description: 'Notas generales del pedido' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: OrderDeliveryAddressDto })
  @ValidateNested()
  @Type(() => OrderDeliveryAddressDto)
  deliveryAddress: OrderDeliveryAddressDto;
}
