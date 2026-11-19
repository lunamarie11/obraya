import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderMessage } from './entities/order-message.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { BuyerOrdersController } from './buyer-orders.controller';
import { DeliveryOrdersController } from './delivery-orders.controller';
import { StockModule } from '../stock/stock.module';
import { BuyersModule } from '../buyers/buyers.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AfipModule } from '../afip/afip.module';
import { EmailModule } from '../email/email.module';
import { Company } from '../users/entities/company.entity';
import { Product } from '../products/entities/product.entity';
import { PricesModule } from '../prices/prices.module';
import { LogisticsModule } from '../logistics/logistics.module';
import { DeliveryModule } from '../delivery/delivery.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderMessage, Company, Product]),
    PricesModule,
    StockModule,
    BuyersModule,
    PaymentsModule,
    NotificationsModule,
    AfipModule,
    EmailModule,
    // Ver fase4c-entidad-driver.md: OrdersService necesita DriversService
    // para bloquear el claim de repartidores no disponibles. LogisticsModule
    // ya depende de OrdersModule (ADR-018) -> dependencia circular resuelta
    // con forwardRef en ambos lados.
    forwardRef(() => LogisticsModule),
    DeliveryModule,
  ],
  controllers: [OrdersController, BuyerOrdersController, DeliveryOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
