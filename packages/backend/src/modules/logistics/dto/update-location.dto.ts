import { IsLatitude, IsLongitude, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty()
  @Type(() => Number)
  @IsLatitude()
  lat: number;

  @ApiProperty()
  @Type(() => Number)
  @IsLongitude()
  lng: number;

  @ApiPropertyOptional({ description: 'Precision en metros reportada por navigator.geolocation' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  accuracy?: number;

  @ApiPropertyOptional({ description: 'Momento en que el navegador tomo la lectura' })
  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}
