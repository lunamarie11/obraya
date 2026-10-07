// ObraYa - Módulo principal (monolito modular)
// Cada módulo de negocio es independiente y extraíble a microservicio (ver ADR-002)

import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { appConfig, databaseConfig, jwtConfig, storageConfig } from './config/app.config';
import { ThrottlingModule } from './config/throttling.module';
import { CommonModule } from './common/common.module';
import { SanitizeMiddleware } from './common/sanitize.middleware';
import { ErrorTrackingModule } from './common/error-tracking/error-tracking.module';

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
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SearchModule } from './modules/search/search.module';
import { ReviewsModule } from './modules/reviews/reviews.module';

// Módulos de negocio - Fase 4+
import { LogisticsModule } from './modules/logistics/logistics.module';
// import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, storageConfig],
      envFilePath: '.env',
    }),
    ThrottlingModule,
    CommonModule,
    ErrorTrackingModule,
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
    PaymentsModule,
    NotificationsModule,
    SearchModule,
    ReviewsModule,
    LogisticsModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SanitizeMiddleware).forRoutes('*');
  }
}
