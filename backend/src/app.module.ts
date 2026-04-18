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
import { SecurityBridgeMiddleware } from './common/security-bridge.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityBridgeMiddleware)
      .forRoutes('*'); // Aplicar a todas las rutas
  }
}
