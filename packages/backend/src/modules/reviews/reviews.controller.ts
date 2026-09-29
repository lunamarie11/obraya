import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { BuyerJwtAuthGuard } from '../buyers/guards/buyer-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Reseñas del comprador logueado sobre sus propios pedidos (backlog #6
// marketplace-comprador.md). Scopeado por el buyerId del JWT, ver ADR-006.
@ApiTags('buyer-reviews')
@ApiBearerAuth()
@UseGuards(BuyerJwtAuthGuard)
@Controller('buyer-reviews')
export class BuyerReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Calificar un pedido propio ya entregado' })
  async create(@Body() dto: CreateReviewDto, @CurrentUser() buyer: any) {
    return this.reviewsService.create(buyer.id, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Listar las reseñas hechas por el comprador logueado' })
  async findMine(@CurrentUser() buyer: any) {
    return this.reviewsService.findMine(buyer.id);
  }
}
