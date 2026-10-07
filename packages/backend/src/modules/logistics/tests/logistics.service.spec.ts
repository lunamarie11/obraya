import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LogisticsService } from '../logistics.service';
import { DriverLocation } from '../entities/driver-location.entity';
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
};

const mockUserRepo = {
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
        { provide: getRepositoryToken(CompanyUser), useValue: mockUserRepo },
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
  });
});
