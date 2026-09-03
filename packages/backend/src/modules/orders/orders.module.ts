import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderMessage } from './entities/order-message.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { BuyerOrdersController } from './buyer-orders.controller';
import { StockModule } from '../stock/stock.module';
import { BuyersModule } from '../buyers/buyers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderMessage]),
    StockModule,
    BuyersModule,
  ],
  controllers: [OrdersController, BuyerOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
