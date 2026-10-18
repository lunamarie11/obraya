import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverLocation } from './entities/driver-location.entity';
import { Driver } from './entities/driver.entity';
import { CompanyUser } from '../users/entities/company-user.entity';
import { LogisticsService } from './logistics.service';
import { DriversService } from './drivers.service';
import { LogisticsController } from './logistics.controller';
import { OrdersModule } from '../orders/orders.module';

// Fase 4b (ver ADR-018): tracking en vivo de repartidores. Fase 4c (ver
// docs/specs/fase4c-entidad-driver.md): perfil de repartidor (vehiculo,
// telefono, disponibilidad). El resto de Fase 4 (integracion con
// transportistas, ruteo con Google Maps) sigue sin empezar.
//
// forwardRef con OrdersModule: OrdersModule necesita DriversService para
// bloquear el claim de repartidores no disponibles, y este modulo ya
// necesita OrdersService para el tracking (ADR-018) — dependencia circular
// resuelta con forwardRef en ambos @Module() y en el constructor del lado
// que inyecta (ver OrdersModule).

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverLocation, Driver, CompanyUser]),
    forwardRef(() => OrdersModule),
  ],
  controllers: [LogisticsController],
  providers: [LogisticsService, DriversService],
  exports: [LogisticsService, DriversService],
})
export class LogisticsModule {}
