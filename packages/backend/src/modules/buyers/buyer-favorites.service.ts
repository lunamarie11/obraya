import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuyerFavorite, BuyerFavoriteType } from './entities/buyer-favorite.entity';
import { CreateBuyerFavoriteDto } from './dto/create-buyer-favorite.dto';

@Injectable()
export class BuyerFavoritesService {
  constructor(
    @InjectRepository(BuyerFavorite)
    private readonly favoriteRepo: Repository<BuyerFavorite>,
  ) {}

  async findAll(buyerId: string): Promise<BuyerFavorite[]> {
    return this.favoriteRepo.find({
      where: { buyerId },
      order: { createdAt: 'DESC' },
    });
  }

  // Idempotente: si el favorito ya existe para ese buyer, devuelve el
  // existente en vez de fallar por el índice único (buyerId, type, targetId).
  async create(buyerId: string, dto: CreateBuyerFavoriteDto): Promise<BuyerFavorite> {
    const existing = await this.favoriteRepo.findOne({
      where: { buyerId, type: dto.type, targetId: dto.targetId },
    });
    if (existing) return existing;
    const favorite = this.favoriteRepo.create({ ...dto, buyerId });
    return this.favoriteRepo.save(favorite);
  }

  async remove(buyerId: string, type: BuyerFavoriteType, targetId: string): Promise<void> {
    await this.favoriteRepo.delete({ buyerId, type, targetId });
  }
}
