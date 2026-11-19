import { ArrayMaxSize, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetProductImagesDto {
  @ApiProperty({ type: [String], description: 'Lista final de URLs, en orden. La primera es la principal.' })
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  images: string[];
}
