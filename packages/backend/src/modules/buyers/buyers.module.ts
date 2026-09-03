import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Buyer } from './entities/buyer.entity';
import { BuyerAddress } from './entities/buyer-address.entity';
import { BuyerFavorite } from './entities/buyer-favorite.entity';
import { BuyersService } from './buyers.service';
import { BuyerAuthService } from './buyer-auth.service';
import { BuyerAuthController } from './buyer-auth.controller';
import { BuyerAddressesService } from './buyer-addresses.service';
import { BuyerAddressesController } from './buyer-addresses.controller';
import { BuyerFavoritesService } from './buyer-favorites.service';
import { BuyerFavoritesController } from './buyer-favorites.controller';
import { BuyerJwtStrategy } from './strategies/buyer-jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Buyer, BuyerAddress, BuyerFavorite]),
    PassportModule.register({ defaultStrategy: 'jwt-buyer' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiration') },
      }),
    }),
  ],
  controllers: [BuyerAuthController, BuyerAddressesController, BuyerFavoritesController],
  providers: [BuyersService, BuyerAuthService, BuyerAddressesService, BuyerFavoritesService, BuyerJwtStrategy],
  exports: [BuyersService, BuyerAuthService],
})
export class BuyersModule {}
