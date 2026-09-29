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
};

const mockCompanyUserRepo = {};

const mockAfipService = {};
const mockEmailService = {};
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
});
