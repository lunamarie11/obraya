import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderMessage } from '../orders/entities/order-message.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

// Ver ADR-007: Mercado Pago (Checkout Pro) como método de pago real.
@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderMessage])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
