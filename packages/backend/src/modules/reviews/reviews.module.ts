import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Order } from '../orders/entities/order.entity';
import { ReviewsService } from './reviews.service';
import { BuyerReviewsController } from './reviews.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Order])],
  controllers: [BuyerReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
