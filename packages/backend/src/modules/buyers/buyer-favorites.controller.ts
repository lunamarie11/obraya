import { Controller, Get, Post, Delete, Body, Param, UseGuards, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BuyerFavoritesService } from './buyer-favorites.service';
import { CreateBuyerFavoriteDto } from './dto/create-buyer-favorite.dto';
import { BuyerFavoriteType } from './entities/buyer-favorite.entity';
import { BuyerJwtAuthGuard } from './guards/buyer-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Favoritos de productos/fabricantes (backlog #4 marketplace-comprador.md).
// Todas las rutas scopeadas por el buyerId del JWT, ver ADR-006.
@ApiTags('buyer-favorites')
@ApiBearerAuth()
@UseGuards(BuyerJwtAuthGuard)
@Controller('buyer-favorites')
export class BuyerFavoritesController {
  constructor(private readonly favoritesService: BuyerFavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar favoritos (productos y empresas) del comprador logueado' })
  async findAll(@CurrentUser() buyer: any) {
    return this.favoritesService.findAll(buyer.id);
  }

  @Post()
  @ApiOperation({ summary: 'Marcar un producto o empresa como favorito' })
  async create(@Body() dto: CreateBuyerFavoriteDto, @CurrentUser() buyer: any) {
    return this.favoritesService.create(buyer.id, dto);
  }

  @Delete(':type/:targetId')
  @ApiOperation({ summary: 'Quitar un producto o empresa de favoritos' })
  async remove(
    @Param('type') type: string,
    @Param('targetId', ParseUUIDPipe) targetId: string,
    @CurrentUser() buyer: any,
  ) {
    if (type !== 'product' && type !== 'company') {
      throw new BadRequestException('Tipo de favorito inválido');
    }
    await this.favoritesService.remove(buyer.id, type as BuyerFavoriteType, targetId);
    return { success: true };
  }
}
