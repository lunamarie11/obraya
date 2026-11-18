import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverLocation } from './entities/driver-location.entity';
import { Driver } from './entities/driver.entity';
import { DeliveryLocation } from '../delivery/entities/delivery-location.entity';
import { Delivery } from '../delivery/entities/delivery.entity';
import { CompanyUser } from '../users/entities/company-user.entity';
import { LogisticsService } from './logistics.service';
import { DriversService } from './drivers.service';
import { GoogleMapsService } from './google-maps.service';
import { LogisticsController } from './logistics.controller';
import { DeliveryLocationController } from './delivery-location.controller';
import { OrdersModule } from '../orders/orders.module';

// Fase 4b (ver ADR-018): tracking en vivo de repartidores. Fase 4c (ver
// docs/specs/fase4c-entidad-driver.md): perfil de repartidor (vehiculo,
// telefono, disponibilidad). Fase 4e (ver ADR-027): Google Maps (Directions
// API) + tracking de Delivery independiente (ADR-026), que hasta ahora no
// tenia tabla de ubicacion propia.
//
// TypeOrmModule.forFeature incluye Delivery (solo para leer nombre/apellido
// al armar la respuesta de /logistics/locations) sin importar DeliveryModule
// completo -- evita un nuevo ciclo de dependencias; el guard de
// DeliveryJwtAuthGuard funciona igual porque la estrategia 'jwt-delivery' ya
// queda registrada globalmente por DeliveryModule (importado en
// OrdersModule).
//
// forwardRef con OrdersModule: OrdersModule necesita DriversService para
// bloquear el claim de repartidores no disponibles, y este modulo ya
// necesita OrdersService para el tracking (ADR-018) — dependencia circular
// resuelta con forwardRef en ambos @Module() y en el constructor del lado
// que inyecta (ver OrdersModule).

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverLocation, DeliveryLocation, Driver, Delivery, CompanyUser]),
    forwardRef(() => OrdersModule),
  ],
  controllers: [LogisticsController, DeliveryLocationController],
  providers: [LogisticsService, DriversService, GoogleMapsService],
  exports: [LogisticsService, DriversService, GoogleMapsService],
})
export class LogisticsModule {}
