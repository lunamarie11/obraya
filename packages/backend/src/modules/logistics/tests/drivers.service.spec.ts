import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DriversService } from '../drivers.service';
import { Driver, VehicleType } from '../entities/driver.entity';
import { CompanyUser, UserRole } from '../../users/entities/company-user.entity';

function makeDriver(overrides: Partial<Driver> = {}): Driver {
  const d = new Driver();
  d.companyUserId = 'driver-1';
  d.companyId = 'company-uuid-1';
  d.vehicleType = VehicleType.MOTO;
  d.licensePlate = 'AB123CD';
  d.phone = '+54 9 11 1234-5678';
  d.isAvailable = true;
  return Object.assign(d, overrides);
}

function makeUser(overrides: Partial<CompanyUser> = {}): CompanyUser {
  const u = new CompanyUser();
  u.id = 'driver-1';
  u.companyId = 'company-uuid-1';
  u.firstName = 'Juan';
  u.lastName = 'Repartidor';
  u.email = 'juan@test.com';
  u.role = UserRole.LOGISTICA;
  u.isActive = true;
  return Object.assign(u, overrides);
}

const mockDriverRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  upsert: jest.fn(),
};

const mockUserRepo = {
  find: jest.fn(),
};

describe('DriversService', () => {
  let service: DriversService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriversService,
        { provide: getRepositoryToken(Driver), useValue: mockDriverRepo },
        { provide: getRepositoryToken(CompanyUser), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get(DriversService);
  });

  describe('getProfile()', () => {
    it('sin fila: devuelve los defaults (isAvailable true, resto null)', async () => {
      mockDriverRepo.findOne.mockResolvedValueOnce(null);

      const profile = await service.getProfile('driver-1');

      expect(profile).toEqual({ vehicleType: null, licensePlate: null, phone: null, isAvailable: true });
    });

    it('con fila: devuelve los valores guardados', async () => {
      mockDriverRepo.findOne.mockResolvedValueOnce(makeDriver({ isAvailable: false }));

      const profile = await service.getProfile('driver-1');

      expect(profile).toEqual({
        vehicleType: VehicleType.MOTO,
        licensePlate: 'AB123CD',
        phone: '+54 9 11 1234-5678',
        isAvailable: false,
      });
    });
  });

  describe('updateProfile()', () => {
    it('hace upsert solo con los campos del dto, sin tocar isAvailable', async () => {
      mockDriverRepo.findOne.mockResolvedValueOnce(makeDriver({ phone: '111' }));

      await service.updateProfile('driver-1', 'company-uuid-1', { phone: '111' });

      expect(mockDriverRepo.upsert).toHaveBeenCalledWith(
        { companyUserId: 'driver-1', companyId: 'company-uuid-1', phone: '111' },
        ['companyUserId'],
      );
    });
  });

  describe('setAvailability()', () => {
    it('hace upsert solo de isAvailable', async () => {
      mockDriverRepo.findOne.mockResolvedValueOnce(makeDriver({ isAvailable: false }));

      await service.setAvailability('driver-1', 'company-uuid-1', false);

      expect(mockDriverRepo.upsert).toHaveBeenCalledWith(
        { companyUserId: 'driver-1', companyId: 'company-uuid-1', isAvailable: false },
        ['companyUserId'],
      );
    });
  });

  describe('isAvailable()', () => {
    it('sin fila: true (default)', async () => {
      mockDriverRepo.findOne.mockResolvedValueOnce(null);
      await expect(service.isAvailable('driver-1')).resolves.toBe(true);
    });

    it('con fila isAvailable=false: false', async () => {
      mockDriverRepo.findOne.mockResolvedValueOnce(makeDriver({ isAvailable: false }));
      await expect(service.isAvailable('driver-1')).resolves.toBe(false);
    });
  });

  describe('listForCompany()', () => {
    it('sin repartidores Logistica: devuelve vacío sin consultar drivers', async () => {
      mockUserRepo.find.mockResolvedValueOnce([]);

      const result = await service.listForCompany('company-uuid-1');

      expect(result).toEqual([]);
      expect(mockDriverRepo.find).not.toHaveBeenCalled();
    });

    it('incluye repartidores sin perfil completado con los defaults', async () => {
      mockUserRepo.find.mockResolvedValueOnce([makeUser()]);
      mockDriverRepo.find.mockResolvedValueOnce([]);

      const result = await service.listForCompany('company-uuid-1');

      expect(result).toEqual([{
        companyUserId: 'driver-1',
        firstName: 'Juan',
        lastName: 'Repartidor',
        email: 'juan@test.com',
        vehicleType: null,
        licensePlate: null,
        phone: null,
        isAvailable: true,
      }]);
    });

    it('cruza usuarios con su perfil de Driver', async () => {
      mockUserRepo.find.mockResolvedValueOnce([makeUser()]);
      mockDriverRepo.find.mockResolvedValueOnce([makeDriver({ isAvailable: false })]);

      const result = await service.listForCompany('company-uuid-1');

      expect(result).toEqual([{
        companyUserId: 'driver-1',
        firstName: 'Juan',
        lastName: 'Repartidor',
        email: 'juan@test.com',
        vehicleType: VehicleType.MOTO,
        licensePlate: 'AB123CD',
        phone: '+54 9 11 1234-5678',
        isAvailable: false,
      }]);
    });
  });
});
