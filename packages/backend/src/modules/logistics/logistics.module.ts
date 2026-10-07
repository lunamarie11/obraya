import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverLocation } from './entities/driver-location.entity';
import { CompanyUser } from '../users/entities/company-user.entity';
import { LogisticsService } from './logistics.service';
import { LogisticsController } from './logistics.controller';
import { OrdersModule } from '../orders/orders.module';

// Fase 4b (ver ADR-018): tracking en vivo de repartidores. El resto de Fase 4
// (fleet management, integracion con transportistas, ruteo con Google Maps)
// sigue sin empezar.

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverLocation, CompanyUser]),
    OrdersModule,
  ],
  controllers: [LogisticsController],
  providers: [LogisticsService],
  exports: [LogisticsService],
})
export class LogisticsModule {}
