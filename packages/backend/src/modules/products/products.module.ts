import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductVariant])],
  controllers: [ProductsController],
  providers: [ProductsService, StorageService],
  exports: [ProductsService],
})
export class ProductsModule {}
