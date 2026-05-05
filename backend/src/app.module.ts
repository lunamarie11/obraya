import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuthModule } from './modules/auth/auth.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { CommonModule } from './common/common.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './health/health.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SecurityBridgeMiddleware } from './common/security-bridge.middleware';
import { SanitizeMiddleware } from './common/sanitize.middleware';
import { ThrottlingModule } from './config/throttling.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlingModule,
    CommonModule,
    PrismaModule,
    ProductsModule,
    OrdersModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    ExpensesModule,
    DashboardModule,
    AuthModule,
    DeliveryModule,
    AdminModule,
    HealthModule,
    PaymentsModule,
    NotificationsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityBridgeMiddleware, SanitizeMiddleware)
      .forRoutes('*'); // Aplicar a todas las rutas
  }
}
