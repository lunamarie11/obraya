import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ReviewsService } from '../reviews.service';
import { Review } from '../entities/review.entity';
import { Order, OrderStatus } from '../../orders/entities/order.entity';

function makeOrder(overrides: Partial<Order> = {}): Order {
  const o = new Order();
  o.id = 'order-uuid-1';
  o.companyId = 'company-uuid-1';
  o.buyerId = 'buyer-uuid-1';
  o.status = OrderStatus.ENTREGADO;
  return Object.assign(o, overrides);
}

const mockReviewRepo = {
  findOne: jest.fn(),
  create: jest.fn((data) => data),
  save: jest.fn((data) => Promise.resolve({ id: 'review-uuid-1', ...data })),
  find: jest.fn(),
  findAndCount: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockOrderRepo = {
  findOne: jest.fn(),
};

describe('ReviewsService', () => {
  let service: ReviewsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(Review), useValue: mockReviewRepo },
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  describe('create', () => {
    it('lanza NotFoundException si el pedido no existe', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create('buyer-uuid-1', { orderId: 'order-uuid-1', rating: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza ForbiddenException si el pedido no pertenece al comprador', async () => {
      mockOrderRepo.findOne.mockResolvedValue(makeOrder({ buyerId: 'otro-buyer' }));
      await expect(
        service.create('buyer-uuid-1', { orderId: 'order-uuid-1', rating: 5 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lanza BadRequestException si el pedido no está Entregado', async () => {
      mockOrderRepo.findOne.mockResolvedValue(makeOrder({ status: OrderStatus.DESPACHADO }));
      await expect(
        service.create('buyer-uuid-1', { orderId: 'order-uuid-1', rating: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza ConflictException si el pedido ya fue calificado', async () => {
      mockOrderRepo.findOne.mockResolvedValue(makeOrder());
      mockReviewRepo.findOne.mockResolvedValue({ id: 'review-existente' });
      await expect(
        service.create('buyer-uuid-1', { orderId: 'order-uuid-1', rating: 5 }),
      ).rejects.toThrow(ConflictException);
    });

    it('crea la reseña con el companyId resuelto desde el pedido', async () => {
      mockOrderRepo.findOne.mockResolvedValue(makeOrder());
      mockReviewRepo.findOne.mockResolvedValue(null);

      const result = await service.create('buyer-uuid-1', {
        orderId: 'order-uuid-1',
        rating: 4,
        comment: 'Muy buena atención',
      });

      expect(mockReviewRepo.create).toHaveBeenCalledWith({
        buyerId: 'buyer-uuid-1',
        companyId: 'company-uuid-1',
        orderId: 'order-uuid-1',
        rating: 4,
        comment: 'Muy buena atención',
      });
      expect(result).toMatchObject({ companyId: 'company-uuid-1', rating: 4 });
    });
  });

  describe('getAggregatesForCompanies', () => {
    it('devuelve un Map vacío si no hay companyIds', async () => {
      const result = await service.getAggregatesForCompanies([]);
      expect(result.size).toBe(0);
    });

    it('agrega rating promedio y cantidad por empresa', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { companyId: 'company-uuid-1', avg: '4.3333333333', count: '3' },
        ]),
      };
      mockReviewRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getAggregatesForCompanies(['company-uuid-1']);

      expect(result.get('company-uuid-1')).toEqual({ averageRating: 4.3, reviewCount: 3 });
    });
  });

  describe('getAggregateForCompany', () => {
    it('devuelve rating 0 y reviewCount 0 si no hay reseñas', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockReviewRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getAggregateForCompany('company-sin-reviews');

      expect(result).toEqual({ averageRating: 0, reviewCount: 0 });
    });
  });
});
