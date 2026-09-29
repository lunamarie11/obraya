import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ShippingQuoteQueryDto {
  @ApiProperty({ description: 'Código postal de entrega' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;
}
