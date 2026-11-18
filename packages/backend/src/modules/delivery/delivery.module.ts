import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Delivery } from './entities/delivery.entity';
import { DeliveriesService } from './deliveries.service';
import { DeliveryAuthService } from './delivery-auth.service';
import { DeliveryAuthController } from './delivery-auth.controller';
import { DeliveryJwtStrategy } from './strategies/delivery-jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Delivery]),
    PassportModule.register({ defaultStrategy: 'jwt-delivery' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiration') },
      }),
    }),
  ],
  controllers: [DeliveryAuthController],
  providers: [DeliveriesService, DeliveryAuthService, DeliveryJwtStrategy],
  exports: [DeliveriesService, DeliveryAuthService],
})
export class DeliveryModule {}
