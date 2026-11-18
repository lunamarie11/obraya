import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DriverLocation } from './entities/driver-location.entity';
import { DeliveryLocation } from '../delivery/entities/delivery-location.entity';
import { Delivery } from '../delivery/entities/delivery.entity';
import { UpdateLocationDto } from './dto/update-location.dto';
import { CompanyUser } from '../users/entities/company-user.entity';
import { OrdersService } from '../orders/orders.service';

export interface ActiveDriverLocation {
  companyUserId: string;
  firstName: string;
  lastName: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  recordedAt: Date;
  orderId: string;
  orderNumber: string;
}

// Ver ADR-026/ADR-027: mismo shape que ActiveDriverLocation pero para un
// delivery independiente (sin empresa). Se exponen por separado (en vez de
// un campo "type" sobre una sola interfaz) para no romper el contrato que
// ya consume /delivery/map.
export interface ActiveDeliveryLocation {
  deliveryId: string;
  firstName: string;
  lastName: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  recordedAt: Date;
  orderId: string;
  orderNumber: string;
}

export interface LatestLocation {
  lat: number;
  lng: number;
  accuracy: number | null;
  recordedAt: Date;
}

@Injectable()
export class LogisticsService {
  constructor(
    @InjectRepository(DriverLocation)
    private readonly locationRepo: Repository<DriverLocation>,
    @InjectRepository(DeliveryLocation)
    private readonly deliveryLocationRepo: Repository<DeliveryLocation>,
    @InjectRepository(CompanyUser)
    private readonly userRepo: Repository<CompanyUser>,
    @InjectRepository(Delivery)
    private readonly deliveryRepo: Repository<Delivery>,
    // Ver ADR-027: OrdersService ahora tambien inyecta LogisticsService
    // (forwardRef en ese lado) -- el ciclo necesita forwardRef en ambos
    // extremos o NestJS resuelve este param como undefined en runtime.
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {}

  // Ver ADR-018: upsert puro, no valida que el repartidor tenga un pedido
  // activo en este momento — ese filtro se aplica al leer
  // (getActiveDriverLocations), no al escribir.
  async upsertLocation(companyUserId: string, companyId: string, dto: UpdateLocationDto): Promise<void> {
    await this.locationRepo.upsert(
      {
        companyUserId,
        companyId,
        lat: dto.lat,
        lng: dto.lng,
        accuracy: dto.accuracy ?? null,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
      },
      ['companyUserId'],
    );
  }

  // Espejo de upsertLocation, para la identidad Delivery independiente
  // (ADR-026/ADR-027). Mismo criterio: upsert puro, sin validar pedido
  // activo al escribir.
  async upsertDeliveryLocation(deliveryId: string, dto: UpdateLocationDto): Promise<void> {
    await this.deliveryLocationRepo.upsert(
      {
        deliveryId,
        lat: dto.lat,
        lng: dto.lng,
        accuracy: dto.accuracy ?? null,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
      },
      ['deliveryId'],
    );
  }

  // Ver ADR-018 (extendido en ADR-027): devuelve repartidores con un pedido
  // Despachado asignado en este momento (cruce con OrdersService), tanto
  // internos (driver_locations) como delivery independiente
  // (delivery_locations) -- aunque tengan una fila de una entrega anterior.
  async getActiveDriverLocations(companyId: string): Promise<(ActiveDriverLocation | ActiveDeliveryLocation)[]> {
    const assignments = await this.ordersService.findActiveAssignments(companyId);
    if (!assignments.length) return [];

    const driverAssignments = assignments.filter((a) => !!a.assignedDriverId);
    const deliveryAssignments = assignments.filter((a) => !!a.assignedDeliveryId);

    const [driverResults, deliveryResults] = await Promise.all([
      this.resolveDriverLocations(companyId, driverAssignments),
      this.resolveDeliveryLocations(deliveryAssignments),
    ]);

    return [...driverResults, ...deliveryResults];
  }

  private async resolveDriverLocations(
    companyId: string,
    assignments: { orderId: string; orderNumber: string; assignedDriverId: string | null }[],
  ): Promise<ActiveDriverLocation[]> {
    if (!assignments.length) return [];
    const driverIds = [...new Set(assignments.map((a) => a.assignedDriverId as string))];

    const [locations, users] = await Promise.all([
      this.locationRepo.find({ where: { companyUserId: In(driverIds), companyId } }),
      this.userRepo.find({ where: { id: In(driverIds) } }),
    ]);
    if (!locations.length) return [];

    const userById = new Map(users.map((u) => [u.id, u]));
    const assignmentByDriver = new Map(assignments.map((a) => [a.assignedDriverId, a]));

    return locations
      .map((loc) => {
        const user = userById.get(loc.companyUserId);
        const assignment = assignmentByDriver.get(loc.companyUserId);
        if (!user || !assignment) return null;
        return {
          companyUserId: loc.companyUserId,
          firstName: user.firstName,
          lastName: user.lastName,
          lat: Number(loc.lat),
          lng: Number(loc.lng),
          accuracy: loc.accuracy,
          recordedAt: loc.recordedAt,
          orderId: assignment.orderId,
          orderNumber: assignment.orderNumber,
        };
      })
      .filter((x): x is ActiveDriverLocation => x !== null);
  }

  private async resolveDeliveryLocations(
    assignments: { orderId: string; orderNumber: string; assignedDeliveryId: string | null }[],
  ): Promise<ActiveDeliveryLocation[]> {
    if (!assignments.length) return [];
    const deliveryIds = [...new Set(assignments.map((a) => a.assignedDeliveryId as string))];

    const [locations, deliveries] = await Promise.all([
      this.deliveryLocationRepo.find({ where: { deliveryId: In(deliveryIds) } }),
      this.deliveryRepo.find({ where: { id: In(deliveryIds) } }),
    ]);
    if (!locations.length) return [];

    const deliveryById = new Map(deliveries.map((d) => [d.id, d]));
    const assignmentByDelivery = new Map(assignments.map((a) => [a.assignedDeliveryId, a]));

    return locations
      .map((loc) => {
        const delivery = deliveryById.get(loc.deliveryId);
        const assignment = assignmentByDelivery.get(loc.deliveryId);
        if (!delivery || !assignment) return null;
        return {
          deliveryId: loc.deliveryId,
          firstName: delivery.firstName,
          lastName: delivery.lastName,
          lat: Number(loc.lat),
          lng: Number(loc.lng),
          accuracy: loc.accuracy,
          recordedAt: loc.recordedAt,
          orderId: assignment.orderId,
          orderNumber: assignment.orderNumber,
        };
      })
      .filter((x): x is ActiveDeliveryLocation => x !== null);
  }

  // Ver ADR-027 / fase4e: usado por BuyerOrdersController (GET
  // /buyer-orders/:id/tracking) para resolver la ultima posicion conocida
  // del repartidor asignado a un pedido, sea interno o independiente. Un
  // pedido tiene a lo sumo uno de los dos ids seteado (ver Order entity).
  async getLocationForAssignment(
    assignedDriverId: string | null,
    assignedDeliveryId: string | null,
  ): Promise<LatestLocation | null> {
    if (assignedDriverId) {
      const loc = await this.locationRepo.findOne({ where: { companyUserId: assignedDriverId } });
      if (!loc) return null;
      return { lat: Number(loc.lat), lng: Number(loc.lng), accuracy: loc.accuracy, recordedAt: loc.recordedAt };
    }
    if (assignedDeliveryId) {
      const loc = await this.deliveryLocationRepo.findOne({ where: { deliveryId: assignedDeliveryId } });
      if (!loc) return null;
      return { lat: Number(loc.lat), lng: Number(loc.lng), accuracy: loc.accuracy, recordedAt: loc.recordedAt };
    }
    return null;
  }
}
