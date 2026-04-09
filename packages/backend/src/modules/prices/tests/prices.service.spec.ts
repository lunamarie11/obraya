import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PricesService } from '../prices.service';
import { Price, PriceType } from '../entities/price.entity';
import { PriceHistory } from '../entities/price-history.entity';

// Fábrica para crear un Price de prueba
function makePrice(overrides: Partial<Price> = {}): Price {
  const p = new Price();
  p.id = 'price-uuid-1';
  p.productId = 'product-uuid-1';
  p.type = PriceType.B2C;
  p.basePrice = 100000; // $1000.00 ARS
  p.currency = 'ARS';
  p.volumePrices = null as any;
  p.scheduledDiscount = null as any;
  p.isActive = true;
  return Object.assign(p, overrides);
}

const mockPriceRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockHistoryRepo = {
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockDataSource = {
  transaction: jest.fn((cb) => cb({ getRepository: jest.fn() })),
};

describe('PricesService', () => {
  let service: PricesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricesService,
        { provide: getRepositoryToken(Price), useValue: mockPriceRepo },
        { provide: getRepositoryToken(PriceHistory), useValue: mockHistoryRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<PricesService>(PricesService);
    jest.clearAllMocks();
  });

  describe('resolve()', () => {
    it('retorna null si no existe precio para el producto', async () => {
      mockPriceRepo.findOne.mockResolvedValue(null);
      const result = await service.resolve('product-1', PriceType.B2C, 1);
      expect(result).toBeNull();
    });

    it('retorna precio base sin descuento cuando no hay descuentos configurados', async () => {
      mockPriceRepo.findOne.mockResolvedValue(makePrice());
      const result = await service.resolve('product-1', PriceType.B2C, 1);
      expect(result).not.toBeNull();
      expect(result!.finalPrice).toBe(100000);
      expect(result!.discountPercent).toBe(0);
      expect(result!.discountSource).toBe('none');
    });

    it('aplica descuento por volumen según la cantidad', async () => {
      const price = makePrice({
        volumePrices: [
          { minQuantity: 10, discountPercent: 5 },
          { minQuantity: 100, discountPercent: 10 },
        ],
      });
      mockPriceRepo.findOne.mockResolvedValue(price);

      // 50 unidades → aplica el de minQuantity=10 (5%)
      const result = await service.resolve('product-1', PriceType.B2C, 50);
      expect(result!.discountPercent).toBe(5);
      expect(result!.discountSource).toBe('volume');
      expect(result!.finalPrice).toBe(95000); // 100000 * 0.95
    });

    it('aplica el descuento de volumen más alto cuando supera múltiples umbrales', async () => {
      const price = makePrice({
        volumePrices: [
          { minQuantity: 10, discountPercent: 5 },
          { minQuantity: 100, discountPercent: 10 },
        ],
      });
      mockPriceRepo.findOne.mockResolvedValue(price);

      // 150 unidades → aplica el de minQuantity=100 (10%)
      const result = await service.resolve('product-1', PriceType.B2C, 150);
      expect(result!.discountPercent).toBe(10);
      expect(result!.finalPrice).toBe(90000); // 100000 * 0.90
    });

    it('no aplica descuento de volumen si la cantidad es 1', async () => {
      const price = makePrice({
        volumePrices: [{ minQuantity: 10, discountPercent: 5 }],
      });
      mockPriceRepo.findOne.mockResolvedValue(price);

      const result = await service.resolve('product-1', PriceType.B2C, 1);
      expect(result!.discountSource).toBe('none');
      expect(result!.discountPercent).toBe(0);
    });

    it('aplica descuento programado cuando está dentro del rango de fechas', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const price = makePrice({
        scheduledDiscount: {
          discountPercent: 20,
          startDate: yesterday.toISOString().split('T')[0],
          endDate: tomorrow.toISOString().split('T')[0],
          label: 'Promo Test',
        },
      });
      mockPriceRepo.findOne.mockResolvedValue(price);

      const result = await service.resolve('product-1', PriceType.B2C, 1);
      expect(result!.discountPercent).toBe(20);
      expect(result!.discountSource).toBe('scheduled');
      expect(result!.finalPrice).toBe(80000); // 100000 * 0.80
    });

    it('NO aplica descuento programado fuera del rango de fechas', async () => {
      const pastStart = '2020-01-01';
      const pastEnd = '2020-12-31';

      const price = makePrice({
        scheduledDiscount: {
          discountPercent: 20,
          startDate: pastStart,
          endDate: pastEnd,
        },
      });
      mockPriceRepo.findOne.mockResolvedValue(price);

      const result = await service.resolve('product-1', PriceType.B2C, 1);
      expect(result!.discountSource).toBe('none');
      expect(result!.discountPercent).toBe(0);
    });

    it('descuento programado tiene precedencia sobre descuento por volumen', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const price = makePrice({
        volumePrices: [{ minQuantity: 10, discountPercent: 15 }],
        scheduledDiscount: {
          discountPercent: 25,
          startDate: yesterday.toISOString().split('T')[0],
          endDate: tomorrow.toISOString().split('T')[0],
        },
      });
      mockPriceRepo.findOne.mockResolvedValue(price);

      // 50 unidades: hay descuento de volumen (15%) Y programado (25%) activo
      const result = await service.resolve('product-1', PriceType.B2C, 50);
      expect(result!.discountSource).toBe('scheduled'); // programado gana
      expect(result!.discountPercent).toBe(25);
      expect(result!.finalPrice).toBe(75000); // 100000 * 0.75
    });
  });
});
