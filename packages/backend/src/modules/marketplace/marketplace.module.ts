import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../users/entities/company.entity';
import { Product } from '../products/entities/product.entity';
import { Stock } from '../stock/entities/stock.entity';
import { Price } from '../prices/entities/price.entity';
import { SponsoredBanner } from './entities/sponsored-banner.entity';
import { PricesModule } from '../prices/prices.module';
import { SearchModule } from '../search/search.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { MarketplacePublicController } from './marketplace-public.controller';
import { MarketplacePublicService } from './marketplace-public.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Product, Stock, Price, SponsoredBanner]),
    PricesModule,
    SearchModule,
    ReviewsModule,
  ],
  controllers: [MarketplacePublicController],
  providers: [MarketplacePublicService],
})
export class MarketplaceModule {}
