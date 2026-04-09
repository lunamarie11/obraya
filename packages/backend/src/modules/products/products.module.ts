import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// MVP: CRUD productos, imagenes, fichas tecnicas, variantes, import CSV masivo

@Module({
  imports: [
    // TypeOrmModule.forFeature([Product, ProductVariant, Stock, Price, ProductImage, TechnicalSheet]),
  ],
  controllers: [
    // ProductController,
    // ImportController,
  ],
  providers: [
    // ProductService,
    // ImportService,
    // S3Service (for images and technical sheets),
  ],
  exports: [
    // ProductService,
  ],
})
export class ProductsModule {}
