import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DriverLocation } from './entities/driver-location.entity';
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

@Injectable()
export class LogisticsService {
  constructor(
    @InjectRepository(DriverLocation)
    private readonly locationRepo: Repository<DriverLocation>,
    @InjectRepository(CompanyUser)
    private readonly userRepo: Repository<CompanyUser>,
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

  // Ver ADR-018: solo devuelve repartidores con un pedido Despachado
  // asignado en este momento (cruce con OrdersService), aunque tengan una
  // fila en driver_locations de una entrega anterior.
  async getActiveDriverLocations(companyId: string): Promise<ActiveDriverLocation[]> {
    const assignments = await this.ordersService.findActiveAssignments(companyId);
    if (!assignments.length) return [];

    const driverIds = [...new Set(assignments.map((a) => a.assignedDriverId))];
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
}
