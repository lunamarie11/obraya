import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { CreateReviewDto } from './dto/create-review.dto';

export interface ReviewAggregate {
  averageRating: number;
  reviewCount: number;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    // Inyectado directo (no OrdersService) para no crear dependencia circular con
    // OrdersModule, mismo criterio que PaymentsController (ver ADR-007).
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async create(buyerId: string, dto: CreateReviewDto): Promise<Review> {
    const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.buyerId !== buyerId) {
      throw new ForbiddenException('El pedido no pertenece al comprador');
    }
    if (order.status !== OrderStatus.ENTREGADO) {
      throw new BadRequestException('Solo se pueden calificar pedidos entregados');
    }

    const existing = await this.reviewRepo.findOne({ where: { orderId: dto.orderId } });
    if (existing) throw new ConflictException('Este pedido ya fue calificado');

    const review = this.reviewRepo.create({
      buyerId,
      companyId: order.companyId,
      orderId: dto.orderId,
      rating: dto.rating,
      comment: dto.comment,
    });
    return this.reviewRepo.save(review);
  }

  async findMine(buyerId: string): Promise<Review[]> {
    return this.reviewRepo.find({ where: { buyerId }, order: { createdAt: 'DESC' } });
  }

  async findByCompany(companyId: string, opts?: { page?: number; limit?: number }) {
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 20;
    const [data, total] = await this.reviewRepo.findAndCount({
      where: { companyId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Agregado usado por el marketplace público (StoreCard, ficha fabricante, "mejor
  // calificados" en el home). Batch para evitar N+1 al listar varias empresas.
  async getAggregatesForCompanies(companyIds: string[]): Promise<Map<string, ReviewAggregate>> {
    const map = new Map<string, ReviewAggregate>();
    if (companyIds.length === 0) return map;

    const rows = await this.reviewRepo
      .createQueryBuilder('review')
      .select('review.companyId', 'companyId')
      .addSelect('AVG(review.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('review.companyId IN (:...companyIds)', { companyIds })
      .groupBy('review.companyId')
      .getRawMany();

    for (const row of rows) {
      map.set(row.companyId, {
        averageRating: Math.round(parseFloat(row.avg) * 10) / 10,
        reviewCount: parseInt(row.count, 10),
      });
    }
    return map;
  }

  async getAggregateForCompany(companyId: string): Promise<ReviewAggregate> {
    const map = await this.getAggregatesForCompanies([companyId]);
    return map.get(companyId) ?? { averageRating: 0, reviewCount: 0 };
  }
}
