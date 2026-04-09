import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// MVP: Recepcion, estados (Nuevo->Aceptado->Preparacion->Despachado->Entregado), chat con comprador

@Module({
  imports: [
    // TypeOrmModule.forFeature([Order, OrderItem, OrderStatus, OrderChat, OrderTimeline]),
  ],
  controllers: [
    // OrderController,
    // OrderChatController,
  ],
  providers: [
    // OrderService,
    // OrderChatService,
    // OrderStateManager,
  ],
  exports: [
    // OrderService,
  ],
})
export class OrdersModule {}
