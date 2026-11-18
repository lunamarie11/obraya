import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DeliveriesService } from './deliveries.service';
import { Delivery } from './entities/delivery.entity';

export interface DeliveryJwtPayload {
  sub: string; // deliveryId
  email: string;
  type: 'delivery';
}

export interface DeliveryAuthTokens {
  accessToken: string;
  refreshToken: string;
  delivery: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    vehicleType: string;
    licensePlate?: string | null;
  };
}

@Injectable()
export class DeliveryAuthService {
  constructor(
    private readonly deliveriesService: DeliveriesService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(delivery: Delivery): Promise<DeliveryAuthTokens> {
    const payload: DeliveryJwtPayload = {
      sub: delivery.id,
      email: delivery.email,
      type: 'delivery',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get('jwt.secret'),
        expiresIn: this.config.get('jwt.expiration'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get('jwt.refreshSecret'),
        expiresIn: this.config.get('jwt.refreshExpiration'),
      }),
    ]);

    await this.deliveriesService.updateLastLogin(delivery.id);

    return {
      accessToken,
      refreshToken,
      delivery: {
        id: delivery.id,
        email: delivery.email,
        firstName: delivery.firstName,
        lastName: delivery.lastName,
        phone: delivery.phone,
        vehicleType: delivery.vehicleType,
        licensePlate: delivery.licensePlate,
      },
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<DeliveryJwtPayload>(token, {
        secret: this.config.get('jwt.refreshSecret'),
      });

      const delivery = await this.deliveriesService.findById(payload.sub);
      if (!delivery || !delivery.isActive) throw new UnauthorizedException('Repartidor inválido');

      const newPayload: DeliveryJwtPayload = {
        sub: delivery.id,
        email: delivery.email,
        type: 'delivery',
      };

      const accessToken = await this.jwtService.signAsync(newPayload, {
        secret: this.config.get('jwt.secret'),
        expiresIn: this.config.get('jwt.expiration'),
      });

      return { accessToken };
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }
}
