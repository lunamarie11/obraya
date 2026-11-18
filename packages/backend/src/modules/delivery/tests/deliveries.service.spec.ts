import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { DeliveriesService } from '../deliveries.service';
import { Delivery } from '../entities/delivery.entity';

const mockDeliveryRepo = {
  findOne: jest.fn(),
  create: jest.fn((v) => v),
  save: jest.fn((v) => Promise.resolve({ ...v, id: 'delivery-uuid-1' })),
  update: jest.fn(),
};

describe('DeliveriesService', () => {
  let service: DeliveriesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeliveriesService, { provide: getRepositoryToken(Delivery), useValue: mockDeliveryRepo }],
    }).compile();

    service = module.get(DeliveriesService);
  });

  // Bug real en producción: un repartidor se registró, el email quedó
  // guardado con mayúsculas/espacios, y al loguearse con la versión
  // normalizada no se encontraba la fila -> "Credenciales inválidas".
  // Ver normalize-email.ts.
  describe('normalización de email', () => {
    it('register guarda el email normalizado (trim + lowercase)', async () => {
      mockDeliveryRepo.findOne.mockResolvedValue(null);

      const dto = {
        email: '  Repartidor@Test.COM  ',
        password: 'Password123!',
        firstName: 'Juan',
        lastName: 'Perez',
        phone: '+54 11 1234-5678',
        vehicleType: 'moto',
        licensePlate: 'AB123CD',
      } as any;

      const delivery = await service.register(dto);

      expect(delivery.email).toBe('repartidor@test.com');
      expect(mockDeliveryRepo.findOne).toHaveBeenCalledWith({ where: { email: 'repartidor@test.com' } });
    });

    it('validateDelivery encuentra la cuenta aunque el login tenga otra capitalización', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 12);
      mockDeliveryRepo.findOne.mockResolvedValue({
        id: 'delivery-uuid-1',
        email: 'repartidor@test.com',
        passwordHash,
        isActive: true,
      });

      const delivery = await service.validateDelivery('  Repartidor@Test.COM  ', 'Password123!');

      expect(mockDeliveryRepo.findOne).toHaveBeenCalledWith({ where: { email: 'repartidor@test.com' } });
      expect(delivery.id).toBe('delivery-uuid-1');
    });

    it('rechaza con mensaje genérico si el usuario no existe', async () => {
      mockDeliveryRepo.findOne.mockResolvedValue(null);
      await expect(service.validateDelivery('nadie@test.com', 'x')).rejects.toThrow(UnauthorizedException);
    });

    it('register rechaza si el email ya existe (normalizado)', async () => {
      mockDeliveryRepo.findOne.mockResolvedValue({ id: 'otro' });
      await expect(service.register({ email: 'Repartidor@Test.com', password: 'x' } as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
