import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DeliveriesService } from '../deliveries.service';
import { DeliveryJwtPayload } from '../delivery-auth.service';

// Estrategia separada de 'jwt' (CompanyUser) y 'jwt-buyer' (Buyer) -- ver
// ADR-026. No toca ningun guard/ruta existente.
@Injectable()
export class DeliveryJwtStrategy extends PassportStrategy(Strategy, 'jwt-delivery') {
  constructor(
    private readonly config: ConfigService,
    private readonly deliveriesService: DeliveriesService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') ?? 'change-me',
    });
  }

  async validate(payload: DeliveryJwtPayload) {
    const delivery = await this.deliveriesService.findById(payload.sub);
    if (!delivery || !delivery.isActive) {
      throw new UnauthorizedException('Repartidor inválido o inactivo');
    }
    return {
      id: delivery.id,
      email: delivery.email,
      firstName: delivery.firstName,
      lastName: delivery.lastName,
    };
  }
}
