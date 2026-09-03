import { IsIn, IsUUID } from 'class-validator';
import { BuyerFavoriteType } from '../entities/buyer-favorite.entity';

export class CreateBuyerFavoriteDto {
  @IsIn(['product', 'company'])
  type: BuyerFavoriteType;

  @IsUUID()
  targetId: string;
}
