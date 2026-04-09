// ObraYa - Módulo principal (monolito modular)
// Cada módulo de negocio es independiente y extraíble a microservicio (ver ADR-002)

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { appConfig, databaseConfig, jwtConfig, storageConfig } from './config/app.config';

// Módulos de negocio - MVP Backoffice (Fase 1)
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { StockModule } from './modules/stock/stock.module';

// Módulos de negocio - Fase 2+
// import { OrdersModule } from './modules/orders/orders.module';
// import { PaymentsModule } from './modules/payments/payments.module';
// import { LogisticsModule } from './modules/logistics/logistics.module';
// import { NotificationsModule } from './modules/notifications/notifications.module';
// import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, storageConfig],
      envFilePath: '.env',
    }),
    DatabaseModule,
    UsersModule,
    ProductsModule,
    StockModule,
  ],
})
export class AppModule {}
