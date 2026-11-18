import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from '../users.service';
import { Company, FleetType } from '../entities/company.entity';
import { CompanyUser } from '../entities/company-user.entity';
import { AfipService } from '../../afip/afip.service';
import { EmailService } from '../../email/email.service';
import { ConfigService } from '@nestjs/config';

function makeCompany(overrides: Partial<Company> = {}): Company {
  const c = new Company();
  c.id = 'company-uuid-1';
  c.razonSocial = 'Cerámicas del Sur S.A.';
  c.cuit = '30500010912';
  return Object.assign(c, overrides);
}

const mockCompanyRepo = {
  update: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((v) => v),
  save: jest.fn((v) => Promise.resolve(v)),
};

const mockCompanyUserRepo = {
  findOne: jest.fn(),
  create: jest.fn((v) => v),
  save: jest.fn((v) => Promise.resolve(v)),
};

const mockAfipService = {
  getTaxpayerDetails: jest.fn().mockResolvedValue(null),
};
const mockEmailService = {
  sendRegistrationReceivedEmail: jest.fn().mockResolvedValue(undefined),
  sendNewCompanyAdminAlert: jest.fn().mockResolvedValue(undefined),
};
const mockConfig = { get: jest.fn() };

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(Company), useValue: mockCompanyRepo },
        { provide: getRepositoryToken(CompanyUser), useValue: mockCompanyUserRepo },
        { provide: AfipService, useValue: mockAfipService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('updateCompanyProfile', () => {
    it('actualiza solo los campos de perfil/bancarios, sin tocar deliveryZones', async () => {
      const updated = makeCompany({ phone: '+54 11 1234-5678' });
      mockCompanyRepo.findOne.mockResolvedValue(updated);

      const dto = { phone: '+54 11 1234-5678', bankingData: { cbu: '123' } };
      const result = await service.updateCompanyProfile('company-uuid-1', dto as any);

      expect(mockCompanyRepo.update).toHaveBeenCalledWith('company-uuid-1', dto);
      expect(result).toBe(updated);
    });
  });

  describe('updateDeliveryZones', () => {
    it('actualiza unicamente deliveryZones', async () => {
      const zones = [
        { id: 'z1', name: 'CABA', zipCodes: ['1425'], promisedHours: 24, fleetType: FleetType.PROPIA, shippingCost: 500 },
      ];
      const updated = makeCompany({ deliveryZones: zones });
      mockCompanyRepo.findOne.mockResolvedValue(updated);

      const result = await service.updateDeliveryZones('company-uuid-1', zones);

      expect(mockCompanyRepo.update).toHaveBeenCalledWith('company-uuid-1', { deliveryZones: zones });
      expect(result.deliveryZones).toEqual(zones);
    });
  });

  // Bug real en producción: un cliente se registró, el email quedó guardado
  // con mayúsculas/espacios, y al loguearse con la versión normalizada no se
  // encontraba la fila -> "Credenciales inválidas". Ver normalize-email.ts.
  describe('normalización de email', () => {
    it('findUserByEmail busca usando el email normalizado (trim + lowercase)', async () => {
      const user = new CompanyUser();
      mockCompanyUserRepo.findOne.mockResolvedValue(user);

      await service.findUserByEmail('  Admin@Empresa.COM  ');

      expect(mockCompanyUserRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'admin@empresa.com' },
        relations: ['company'],
      });
    });

    it('registerCompany guarda la empresa y el admin con el email normalizado', async () => {
      mockCompanyRepo.findOne.mockResolvedValue(null);
      mockCompanyUserRepo.findOne.mockResolvedValue(null);

      const dto = {
        cuit: '30500010912',
        razonSocial: 'Cerámicas del Sur S.A.',
        email: '  Empresa@Test.COM  ',
        phone: '+54 11 1234-5678',
        city: 'CABA',
        province: 'Buenos Aires',
        adminEmail: '  Admin@Empresa.COM  ',
        adminPassword: 'Password123!',
        adminFirstName: 'Juan',
        adminLastName: 'Perez',
      } as any;

      const { company, adminUser } = await service.registerCompany(dto);

      expect(company.email).toBe('empresa@test.com');
      expect(adminUser.email).toBe('admin@empresa.com');
    });
  });
});
