import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDriverAvailabilityDto {
  @ApiProperty({ description: 'Disponible para recibir pedidos (POST /orders/:id/claim)' })
  @IsBoolean()
  isAvailable: boolean;
}
