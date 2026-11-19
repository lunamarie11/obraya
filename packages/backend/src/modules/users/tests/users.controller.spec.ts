import { ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UsersController } from '../users.controller';
import { UserRole } from '../entities/company-user.entity';
import { InviteUserDto } from '../dto/invite-user.dto';

// SEGURIDAD (19/11/2026): las rutas /companies/:id no verificaban que la
// empresa fuera la del usuario logueado, y una empresa podía invitar
// usuarios SuperAdmin.
describe('UsersController — acceso solo a la propia empresa', () => {
  const service = {
    findCompanyById: jest.fn().mockResolvedValue({ id: 'c1' }),
    updateCompanyProfile: jest.fn().mockResolvedValue({ id: 'c1' }),
    updateDeliveryZones: jest.fn().mockResolvedValue({ id: 'c1' }),
    getCompanyUsers: jest.fn().mockResolvedValue([]),
    inviteUser: jest.fn().mockResolvedValue({ id: 'u2', inviteToken: 't' }),
  };
  const controller = new UsersController(service as any);
  const adminOtra = { id: 'u9', role: UserRole.ADMIN, companyId: 'otra' };
  const adminPropia = { id: 'u1', role: UserRole.ADMIN, companyId: 'c1' };
  const superAdmin = { id: 'sa', role: UserRole.SUPER_ADMIN, companyId: null };

  beforeEach(() => jest.clearAllMocks());

  it('Admin de otra empresa NO puede ver los datos (bancarios) de c1', async () => {
    await expect(controller.getCompany('c1', adminOtra)).rejects.toThrow(ForbiddenException);
    expect(service.findCompanyById).not.toHaveBeenCalled();
  });

  it('Admin de otra empresa NO puede cambiar el CBU de c1', async () => {
    await expect(controller.updateCompany('c1', { bankingData: { cbu: '000' } } as any, adminOtra)).rejects.toThrow(ForbiddenException);
    expect(service.updateCompanyProfile).not.toHaveBeenCalled();
  });

  it('Admin de otra empresa NO puede invitarse en c1', async () => {
    await expect(controller.inviteUser('c1', { email: 'x@x.com', role: UserRole.ADMIN } as any, adminOtra)).rejects.toThrow(ForbiddenException);
    expect(service.inviteUser).not.toHaveBeenCalled();
  });

  it('Admin de otra empresa NO puede ver usuarios ni zonas de c1', async () => {
    await expect(controller.getCompanyUsers('c1', adminOtra)).rejects.toThrow(ForbiddenException);
    await expect(controller.updateDeliveryZones('c1', { deliveryZones: [] } as any, adminOtra)).rejects.toThrow(ForbiddenException);
  });

  it('Admin de la propia empresa sí puede', async () => {
    await expect(controller.getCompany('c1', adminPropia)).resolves.toEqual({ id: 'c1' });
    await expect(controller.updateCompany('c1', {} as any, adminPropia)).resolves.toEqual({ id: 'c1' });
  });

  it('SuperAdmin puede operar sobre cualquier empresa', async () => {
    await expect(controller.getCompany('c1', superAdmin)).resolves.toEqual({ id: 'c1' });
  });

  it('una empresa no puede invitar usuarios SuperAdmin', async () => {
    const dto = plainToInstance(InviteUserDto, { email: 'x@x.com', firstName: 'X', lastName: 'Y', role: UserRole.SUPER_ADMIN });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'role')).toBe(true);
    const ok = plainToInstance(InviteUserDto, { email: 'x@x.com', firstName: 'X', lastName: 'Y', role: UserRole.LOGISTICA });
    expect((await validate(ok)).some((e) => e.property === 'role')).toBe(false);
  });
});
