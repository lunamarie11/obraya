import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../users/entities/company.entity';
import { Product } from '../products/entities/product.entity';
import { Stock } from '../stock/entities/stock.entity';
import { PricesModule } from '../prices/prices.module';
import { MarketplacePublicController } from './marketplace-public.controller';
import { MarketplacePublicService } from './marketplace-public.service';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Product, Stock]), PricesModule],
  controllers: [MarketplacePublicController],
  providers: [MarketplacePublicService],
})
export class MarketplaceModule {}
