import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PublicProductDetailQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number = 1;
}
