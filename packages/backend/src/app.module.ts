// ObraYa - Modulo principal (monolito modular)
// Cada modulo de negocio es independiente y extraible a microservicio
// Ver ADR-002 para la estrategia de migracion

import { Module } from '@nestjs/common';

// Modulos de negocio - MVP Backoffice (Fase 1)
// import { UsersModule } from './modules/users/users.module';
// import { ProductsModule } from './modules/products/products.module';
// import { OrdersModule } from './modules/orders/orders.module';

// Modulos de negocio - Fase 2+
// import { PaymentsModule } from './modules/payments/payments.module';
// import { LogisticsModule } from './modules/logistics/logistics.module';
// import { NotificationsModule } from './modules/notifications/notifications.module';
// import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    // Descomentar a medida que se implementan:
    // UsersModule,
    // ProductsModule,
    // OrdersModule,
  ],
})
export class AppModule {}
