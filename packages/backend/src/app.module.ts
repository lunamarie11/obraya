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
import { PricesModule } from './modules/prices/prices.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AdminModule } from './modules/admin/admin.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { BuyersModule } from './modules/buyers/buyers.module';

// Módulos de negocio - Fase 2+
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
    PricesModule,
    OrdersModule,
    DashboardModule,
    ReportsModule,
    AdminModule,
    MonitoringModule,
    MarketplaceModule,
    BuyersModule,
  ],
})
export class AppModule {}
