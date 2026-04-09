import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { OrdersModule } from '../orders/orders.module';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [OrdersModule, StockModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
