import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { MarketplacePublicService } from '../marketplace-public.service';
import { Company, CompanyStatus, FleetType } from '../../users/entities/company.entity';
import { Product } from '../../products/entities/product.entity';
import { Stock } from '../../stock/entities/stock.entity';
import { PricesService } from '../../prices/prices.service';
import { Price, PriceType } from '../../prices/entities/price.entity';
import { SearchService } from '../../search/search.service';
import { ReviewsService } from '../../reviews/reviews.service';

function makeCompany(overrides: Partial<Company> = {}): Company {
  const c = new Company();
  c.id = 'company-uuid-1';
  c.razonSocial = 'Materiales SA';
  c.status = CompanyStatus.ACTIVE;
  c.logoUrl = 'https://example.com/logo.png';
  c.city = 'CABA';
  c.province = 'Buenos Aires';
  c.deliveryZones = [{
    id: 'zone-1', name: 'CABA', zipCodes: ['1000', '1001'],
    promisedHours: 24, fleetType: FleetType.PROPIA, shippingCost: 0,
  }];
  return Object.assign(c, overrides);
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  const p = new Product();
  p.id = 'product-uuid-1';
  p.companyId = 'company-uuid-1';
  p.name = 'Cemento Portland';
  p.category = 'Cemento';
  p.images = [];
  p.isActive = true;
  return Object.assign(p, overrides);
}

const mockCompanyRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
};

const mockQueryBuilder = {
  innerJoinAndSelect: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
};

const mockProductRepo = {
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

const mockStockRepo = {
  find: jest.fn(),
};

const mockPriceQueryBuilder = {
  innerJoinAndSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
};

const mockPriceRepo = {
  createQueryBuilder: jest.fn(() => mockPriceQueryBuilder),
};

const mockPricesService = {
  resolve: jest.fn(),
};

const mockSearchService = {
  isAvailable: jest.fn().mockReturnValue(false),
  search: jest.fn(),
};

const mockReviewsService = {
  getAggregatesForCompanies: jest.fn().mockResolvedValue(new Map()),
  getAggregateForCompany: jest.fn().mockResolvedValue({ averageRating: 0, reviewCount: 0 }),
  findByCompany: jest.fn(),
};

describe('MarketplacePublicService', () => {
  let service: MarketplacePublicService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockStockRepo.find.mockResolvedValue([]);
    mockSearchService.isAvailable.mockReturnValue(false);
    mockReviewsService.getAggregatesForCompanies.mockResolvedValue(new Map());
    mockReviewsService.getAggregateForCompany.mockResolvedValue({ averageRating: 0, reviewCount: 0 });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplacePublicService,
        { provide: getRepositoryToken(Company), useValue: mockCompanyRepo },
        { provide: getRepositoryToken(Product), useValue: mockProductRepo },
        { provide: getRepositoryToken(Stock), useValue: mockStockRepo },
        { provide: getRepositoryToken(Price), useValue: mockPriceRepo },
        { provide: PricesService, useValue: mockPricesService },
        { provide: SearchService, useValue: mockSearchService },
        { provide: ReviewsService, useValue: mockReviewsService },
      ],
    }).compile();

    service = module.get<MarketplacePublicService>(MarketplacePublicService);
  });

  describe('findActiveCompanies', () => {
    it('solo pide empresas con status ACTIVE y devuelve solo campos públicos', async () => {
      mockCompanyRepo.find.mockResolvedValue([makeCompany()]);

      const result = await service.findActiveCompanies();

      expect(mockCompanyRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: CompanyStatus.ACTIVE } }),
      );
      expect(result).toEqual([
        {
          id: 'company-uuid-1',
          razonSocial: 'Materiales SA',
          logoUrl: 'https://example.com/logo.png',
          city: 'CABA',
          province: 'Buenos Aires',
          coverageZones: ['1000', '1001'],
          averageRating: 0,
          reviewCount: 0,
        },
      ]);
      expect(result[0]).not.toHaveProperty('cuit');
      expect(result[0]).not.toHaveProperty('bankingData');
    });
  });

  describe('findActiveCompany', () => {
    it('lanza NotFoundException si la empresa no existe o no está activa', async () => {
      mockCompanyRepo.findOne.mockResolvedValue(null);

      await expect(service.findActiveCompany('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('devuelve la empresa cuando está activa', async () => {
      mockCompanyRepo.findOne.mockResolvedValue(makeCompany());

      const result = await service.findActiveCompany('company-uuid-1');

      expect(result.razonSocial).toBe('Materiales SA');
    });
  });

  describe('findCompanyProducts', () => {
    it('adjunta el precio B2C resuelto a cada producto', async () => {
      mockCompanyRepo.findOne.mockResolvedValue(makeCompany());
      mockProductRepo.findAndCount.mockResolvedValue([[makeProduct()], 1]);
      mockPricesService.resolve.mockResolvedValue({
        basePrice: 100000,
        finalPrice: 90000,
        currency: 'ARS',
        discountPercent: 10,
        discountSource: 'volume',
        type: PriceType.B2C,
      });

      const result = await service.findCompanyProducts('company-uuid-1', {});

      expect(mockPricesService.resolve).toHaveBeenCalledWith('product-uuid-1', PriceType.B2C, 1, undefined);
      expect(result.data[0].price).toEqual({
        basePrice: 100000,
        finalPrice: 90000,
        discountPercent: 10,
      });
      expect(result.total).toBe(1);
    });

    it('propaga el 404 si la empresa no está activa', async () => {
      mockCompanyRepo.findOne.mockResolvedValue(null);

      await expect(service.findCompanyProducts('missing-id', {})).rejects.toThrow(NotFoundException);
      expect(mockProductRepo.findAndCount).not.toHaveBeenCalled();
    });
  });

  describe('findAllProducts', () => {
    it('filtra por empresas activas y adjunta el nombre de la empresa', async () => {
      const product = makeProduct();
      (product as any).company = makeCompany();
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[product], 1]);
      mockPricesService.resolve.mockResolvedValue({
        basePrice: 100000,
        finalPrice: 100000,
        currency: 'ARS',
        discountPercent: 0,
        discountSource: 'none',
        type: PriceType.B2C,
      });

      const result = await service.findAllProducts({});

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('company.status = :status', {
        status: CompanyStatus.ACTIVE,
      });
      expect(result.data[0].companyName).toBe('Materiales SA');
      expect(result.total).toBe(1);
    });
  });

  describe('findActivePromotions', () => {
    it('mapea precios con descuento programado activo a banners', async () => {
      const price = new Price();
      price.productId = 'product-uuid-1';
      price.basePrice = 100000;
      price.scheduledDiscount = {
        discountPercent: 20,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        label: 'Promo Invierno',
      };
      (price as any).product = { ...makeProduct(), company: makeCompany() };
      mockPriceQueryBuilder.getMany.mockResolvedValue([price]);

      const result = await service.findActivePromotions();

      expect(mockPriceQueryBuilder.andWhere).toHaveBeenCalledWith(
        "(price.scheduledDiscount->>'startDate')::timestamptz <= :now",
        expect.objectContaining({ now: expect.any(Date) }),
      );
      expect(result).toEqual([
        {
          productId: 'product-uuid-1',
          productName: 'Cemento Portland',
          image: undefined,
          companyId: 'company-uuid-1',
          companyName: 'Materiales SA',
          label: 'Promo Invierno',
          discountPercent: 20,
          basePrice: 100000,
          finalPrice: 80000,
        },
      ]);
    });

    it('devuelve un array vacío si no hay descuentos programados activos', async () => {
      mockPriceQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.findActivePromotions();

      expect(result).toEqual([]);
    });
  });

  describe('findPublicProduct', () => {
    it('lanza NotFoundException si el producto no existe', async () => {
      mockProductRepo.findOne.mockResolvedValue(null);

      await expect(service.findPublicProduct('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('lanza NotFoundException si la empresa dueña no está activa', async () => {
      const product = makeProduct();
      (product as any).company = makeCompany({ status: CompanyStatus.SUSPENDED });
      mockProductRepo.findOne.mockResolvedValue(product);

      await expect(service.findPublicProduct('product-uuid-1')).rejects.toThrow(NotFoundException);
    });

    it('devuelve el producto con precio resuelto cuando la empresa está activa', async () => {
      const product = makeProduct();
      (product as any).company = makeCompany();
      mockProductRepo.findOne.mockResolvedValue(product);
      mockPricesService.resolve.mockResolvedValue({
        basePrice: 50000,
        finalPrice: 50000,
        currency: 'ARS',
        discountPercent: 0,
        discountSource: 'none',
        type: PriceType.B2C,
      });

      const result = await service.findPublicProduct('product-uuid-1');

      expect(result.name).toBe('Cemento Portland');
      expect(result.price?.finalPrice).toBe(50000);
      expect(mockPricesService.resolve).toHaveBeenCalledWith('product-uuid-1', PriceType.B2C, 1, undefined);
    });

    it('propaga variantId y quantity a la resolución de precio', async () => {
      const product = makeProduct();
      (product as any).company = makeCompany();
      mockProductRepo.findOne.mockResolvedValue(product);
      mockPricesService.resolve.mockResolvedValue({
        basePrice: 50000,
        finalPrice: 45000,
        currency: 'ARS',
        discountPercent: 10,
        discountSource: 'volume',
        type: PriceType.B2C,
      });

      await service.findPublicProduct('product-uuid-1', { variantId: 'variant-uuid-1', quantity: 50 });

      expect(mockPricesService.resolve).toHaveBeenCalledWith(
        'product-uuid-1',
        PriceType.B2C,
        50,
        'variant-uuid-1',
      );
    });

    it('suma el stock disponible de todos los depósitos sin scopear por companyId (fix del bug de "sin stock" cross-empresa)', async () => {
      const product = makeProduct();
      (product as any).company = makeCompany();
      mockProductRepo.findOne.mockResolvedValue(product);
      mockPricesService.resolve.mockResolvedValue(null);
      mockStockRepo.find.mockResolvedValue([
        { quantity: 10, reservedQuantity: 2 },
        { quantity: 5, reservedQuantity: 10 }, // reservado > cantidad, no debe restar de más
      ]);

      const result = await service.findPublicProduct('product-uuid-1');

      expect(mockStockRepo.find).toHaveBeenCalledWith({ where: { productId: 'product-uuid-1' } });
      expect(result.availableStock).toBe(8); // (10-2) + max(0, 5-10)
    });

    it('filtra el stock por variantId cuando se especifica', async () => {
      const product = makeProduct();
      (product as any).company = makeCompany();
      mockProductRepo.findOne.mockResolvedValue(product);
      mockPricesService.resolve.mockResolvedValue(null);
      mockStockRepo.find.mockResolvedValue([{ quantity: 3, reservedQuantity: 0 }]);

      await service.findPublicProduct('product-uuid-1', { variantId: 'variant-uuid-1' });

      expect(mockStockRepo.find).toHaveBeenCalledWith({
        where: { productId: 'product-uuid-1', variantId: 'variant-uuid-1' },
      });
    });
  });
});
