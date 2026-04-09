import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Fase 4: Driver app, fleet management, carrier integration (Andreani, OCA), route optimization

@Module({
  imports: [
    // TypeOrmModule.forFeature([Shipment, Driver, Vehicle, Carrier, DeliveryRoute]),
  ],
  controllers: [
    // ShipmentController,
    // DriverController,
    // CarrierController,
  ],
  providers: [
    // ShipmentService,
    // DriverService,
    // CarrierIntegrationService,
    // RouteOptimizationService,
  ],
  exports: [
    // ShipmentService,
  ],
})
export class LogisticsModule {}
