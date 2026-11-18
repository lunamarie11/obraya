import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LogisticsService } from '../logistics.service';
import { DriverLocation } from '../entities/driver-location.entity';
import { DeliveryLocation } from '../../delivery/entities/delivery-location.entity';
import { Delivery } from '../../delivery/entities/delivery.entity';
import { CompanyUser, UserRole } from '../../users/entities/company-user.entity';
import { OrdersService } from '../../orders/orders.service';

function makeDriverLocation(overrides: Partial<DriverLocation> = {}): DriverLocation {
  const loc = new DriverLocation();
  loc.companyUserId = 'driver-1';
  loc.companyId = 'company-uuid-1';
  loc.lat = -34.6037;
  loc.lng = -58.3816;
  loc.accuracy = 15;
  loc.recordedAt = new Date('2026-10-07T12:00:00Z');
  return Object.assign(loc, overrides);
}

function makeDeliveryLocation(overrides: Partial<DeliveryLocation> = {}): DeliveryLocation {
  const loc = new DeliveryLocation();
  loc.deliveryId = 'delivery-1';
  loc.lat = -34.61;
  loc.lng = -58.38;
  loc.accuracy = 20;
  loc.recordedAt = new Date('2026-10-07T12:05:00Z');
  return Object.assign(loc, overrides);
}

function makeDelivery(overrides: Partial<Delivery> = {}): Delivery {
  const d = new Delivery();
  d.id = 'delivery-1';
  d.firstName = 'Pedro';
  d.lastName = 'Delivery';
  return Object.assign(d, overrides);
}

function makeUser(overrides: Partial<CompanyUser> = {}): CompanyUser {
  const u = new CompanyUser();
  u.id = 'driver-1';
  u.companyId = 'company-uuid-1';
  u.firstName = 'Juan';
  u.lastName = 'Repartidor';
  u.role = UserRole.LOGISTICA;
  return Object.assign(u, overrides);
}

const mockLocationRepo = {
  upsert: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

const mockDeliveryLocationRepo = {
  upsert: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

const mockUserRepo = {
  find: jest.fn(),
};

const mockDeliveryRepo = {
  find: jest.fn(),
};

const mockOrdersService = {
  findActiveAssignments: jest.fn(),
};

describe('LogisticsService', () => {
  let service: LogisticsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogisticsService,
        { provide: getRepositoryToken(DriverLocation), useValue: mockLocationRepo },
        { provide: getRepositoryToken(DeliveryLocation), useValue: mockDeliveryLocationRepo },
        { provide: getRepositoryToken(CompanyUser), useValue: mockUserRepo },
        { provide: getRepositoryToken(Delivery), useValue: mockDeliveryRepo },
        { provide: OrdersService, useValue: mockOrdersService },
      ],
    }).compile();

    service = module.get(LogisticsService);
  });

  describe('upsertLocation()', () => {
    it('hace upsert con companyUserId como conflict path', async () => {
      await service.upsertLocation('driver-1', 'company-uuid-1', { lat: -34.6, lng: -58.4, accuracy: 10 });

      expect(mockLocationRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ companyUserId: 'driver-1', companyId: 'company-uuid-1', lat: -34.6, lng: -58.4, accuracy: 10 }),
        ['companyUserId'],
      );
    });

    it('usa recordedAt del dto si viene, si no la hora actual', async () => {
      await service.upsertLocation('driver-1', 'company-uuid-1', {
        lat: -34.6, lng: -58.4, recordedAt: '2026-10-07T10:00:00Z',
      });

      const arg = mockLocationRepo.upsert.mock.calls[0][0];
      expect(arg.recordedAt).toEqual(new Date('2026-10-07T10:00:00Z'));
    });
  });

  describe('getActiveDriverLocations()', () => {
    it('sin pedidos activos: devuelve vacio sin consultar locations/users', async () => {
      mockOrdersService.findActiveAssignments.mockResolvedValueOnce([]);

      const result = await service.getActiveDriverLocations('company-uuid-1');

      expect(result).toEqual([]);
      expect(mockLocationRepo.find).not.toHaveBeenCalled();
    });

    it('cruza locations con pedidos activos y arma la respuesta', async () => {
      mockOrdersService.findActiveAssignments.mockResolvedValueOnce([
        { orderId: 'order-1', orderNumber: 'OBY-001', assignedDriverId: 'driver-1' },
      ]);
      mockLocationRepo.find.mockResolvedValueOnce([makeDriverLocation()]);
      mockUserRepo.find.mockResolvedValueOnce([makeUser()]);

      const result = await service.getActiveDriverLocations('company-uuid-1');

      expect(result).toEqual([
        {
          companyUserId: 'driver-1',
          firstName: 'Juan',
          lastName: 'Repartidor',
          lat: -34.6037,
          lng: -58.3816,
          accuracy: 15,
          recordedAt: makeDriverLocation().recordedAt,
          orderId: 'order-1',
          orderNumber: 'OBY-001',
        },
      ]);
    });

    it('repartidor con pedido activo pero sin posicion reportada: no aparece', async () => {
      mockOrdersService.findActiveAssignments.mockResolvedValueOnce([
        { orderId: 'order-1', orderNumber: 'OBY-001', assignedDriverId: 'driver-1' },
      ]);
      mockLocationRepo.find.mockResolvedValueOnce([]);
      mockUserRepo.find.mockResolvedValueOnce([makeUser()]);

      const result = await service.getActiveDriverLocations('company-uuid-1');

      expect(result).toEqual([]);
    });

    it('posicion de un repartidor sin pedido activo (ya entregado): no aparece', async () => {
      mockOrdersService.findActiveAssignments.mockResolvedValueOnce([
        { orderId: 'order-1', orderNumber: 'OBY-001', assignedDriverId: 'driver-2' },
      ]);
      mockLocationRepo.find.mockResolvedValueOnce([makeDriverLocation({ companyUserId: 'driver-1' })]);
      mockUserRepo.find.mockResolvedValueOnce([makeUser({ id: 'driver-2' })]);

      const result = await service.getActiveDriverLocations('company-uuid-1');

      expect(result).toEqual([]);
    });

    it('cruza delivery_locations con pedidos activos de un delivery independiente (ver ADR-027)', async () => {
      // Sin asignaciones de driver interno: resolveDriverLocations() corta antes
      // de llamar a locationRepo.find()/userRepo.find() (ver logistics.service.ts),
      // por eso no se encolan mocks para esos repos en este test.
      mockOrdersService.findActiveAssignments.mockResolvedValueOnce([
        { orderId: 'order-1', orderNumber: 'OBY-001', assignedDriverId: null, assignedDeliveryId: 'delivery-1' },
      ]);
      mockDeliveryLocationRepo.find.mockResolvedValueOnce([makeDeliveryLocation()]);
      mockDeliveryRepo.find.mockResolvedValueOnce([makeDelivery()]);

      const result = await service.getActiveDriverLocations('company-uuid-1');

      expect(result).toEqual([
        {
          deliveryId: 'delivery-1',
          firstName: 'Pedro',
          lastName: 'Delivery',
          lat: -34.61,
          lng: -58.38,
          accuracy: 20,
          recordedAt: makeDeliveryLocation().recordedAt,
          orderId: 'order-1',
          orderNumber: 'OBY-001',
        },
      ]);
    });

    it('mezcla resultados de driver interno y delivery independiente en la misma empresa', async () => {
      mockOrdersService.findActiveAssignments.mockResolvedValueOnce([
        { orderId: 'order-1', orderNumber: 'OBY-001', assignedDriverId: 'driver-1', assignedDeliveryId: null },
        { orderId: 'order-2', orderNumber: 'OBY-002', assignedDriverId: null, assignedDeliveryId: 'delivery-1' },
      ]);
      mockLocationRepo.find.mockResolvedValueOnce([makeDriverLocation()]);
      mockUserRepo.find.mockResolvedValueOnce([makeUser()]);
      mockDeliveryLocationRepo.find.mockResolvedValueOnce([makeDeliveryLocation()]);
      mockDeliveryRepo.find.mockResolvedValueOnce([makeDelivery()]);

      const result = await service.getActiveDriverLocations('company-uuid-1');

      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ companyUserId: 'driver-1', orderId: 'order-1' }),
          expect.objectContaining({ deliveryId: 'delivery-1', orderId: 'order-2' }),
        ]),
      );
    });
  });

  describe('upsertDeliveryLocation()', () => {
    it('hace upsert con deliveryId como conflict path', async () => {
      await service.upsertDeliveryLocation('delivery-1', { lat: -34.6, lng: -58.4, accuracy: 10 });

      expect(mockDeliveryLocationRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ deliveryId: 'delivery-1', lat: -34.6, lng: -58.4, accuracy: 10 }),
        ['deliveryId'],
      );
    });
  });

  describe('getLocationForAssignment()', () => {
    it('con assignedDriverId: busca en driver_locations', async () => {
      mockLocationRepo.findOne.mockResolvedValueOnce(makeDriverLocation());

      const result = await service.getLocationForAssignment('driver-1', null);

      expect(result).toEqual({ lat: -34.6037, lng: -58.3816, accuracy: 15, recordedAt: makeDriverLocation().recordedAt });
      expect(mockLocationRepo.findOne).toHaveBeenCalledWith({ where: { companyUserId: 'driver-1' } });
    });

    it('con assignedDeliveryId: busca en delivery_locations', async () => {
      mockDeliveryLocationRepo.findOne.mockResolvedValueOnce(makeDeliveryLocation());

      const result = await service.getLocationForAssignment(null, 'delivery-1');

      expect(result).toEqual({ lat: -34.61, lng: -58.38, accuracy: 20, recordedAt: makeDeliveryLocation().recordedAt });
      expect(mockDeliveryLocationRepo.findOne).toHaveBeenCalledWith({ where: { deliveryId: 'delivery-1' } });
    });

    it('sin ninguno de los dos ids: devuelve null sin consultar nada', async () => {
      const result = await service.getLocationForAssignment(null, null);

      expect(result).toBeNull();
      expect(mockLocationRepo.findOne).not.toHaveBeenCalled();
      expect(mockDeliveryLocationRepo.findOne).not.toHaveBeenCalled();
    });

    it('con assignedDriverId pero sin posicion reportada: devuelve null', async () => {
      mockLocationRepo.findOne.mockResolvedValueOnce(null);

      const result = await service.getLocationForAssignment('driver-1', null);

      expect(result).toBeNull();
    });
  });
});
