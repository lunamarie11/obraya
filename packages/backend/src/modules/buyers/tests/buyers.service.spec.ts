import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { BuyersService } from '../buyers.service';
import { Buyer } from '../entities/buyer.entity';

const mockBuyerRepo = {
  findOne: jest.fn(),
  create: jest.fn((v) => v),
  save: jest.fn((v) => Promise.resolve({ ...v, id: 'buyer-uuid-1' })),
  update: jest.fn(),
};

describe('BuyersService', () => {
  let service: BuyersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [BuyersService, { provide: getRepositoryToken(Buyer), useValue: mockBuyerRepo }],
    }).compile();

    service = module.get(BuyersService);
  });

  // Bug real en producción: un cliente se registró, el email quedó guardado
  // con mayúsculas/espacios, y al loguearse con la versión normalizada no se
  // encontraba la fila -> "Credenciales inválidas". Ver normalize-email.ts.
  describe('normalización de email', () => {
    it('register guarda el email normalizado (trim + lowercase)', async () => {
      mockBuyerRepo.findOne.mockResolvedValue(null);

      const dto = {
        email: '  Cliente@Test.COM  ',
        password: 'Password123!',
        firstName: 'Juan',
        lastName: 'Perez',
        phone: '+54 11 1234-5678',
      } as any;

      const buyer = await service.register(dto);

      expect(buyer.email).toBe('cliente@test.com');
      expect(mockBuyerRepo.findOne).toHaveBeenCalledWith({ where: { email: 'cliente@test.com' } });
    });

    it('validateBuyer encuentra la cuenta aunque el login tenga otra capitalización', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 12);
      mockBuyerRepo.findOne.mockResolvedValue({
        id: 'buyer-uuid-1',
        email: 'cliente@test.com',
        passwordHash,
        isActive: true,
      });

      const buyer = await service.validateBuyer('  Cliente@Test.COM  ', 'Password123!');

      expect(mockBuyerRepo.findOne).toHaveBeenCalledWith({ where: { email: 'cliente@test.com' } });
      expect(buyer.id).toBe('buyer-uuid-1');
    });

    it('rechaza con mensaje genérico si el usuario no existe', async () => {
      mockBuyerRepo.findOne.mockResolvedValue(null);
      await expect(service.validateBuyer('nadie@test.com', 'x')).rejects.toThrow(UnauthorizedException);
    });

    it('register rechaza si el email ya existe (normalizado)', async () => {
      mockBuyerRepo.findOne.mockResolvedValue({ id: 'otro' });
      await expect(service.register({ email: 'Cliente@Test.com', password: 'x' } as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
