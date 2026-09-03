import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { BuyersService } from '../buyers.service';
import { BuyerJwtPayload } from '../buyer-auth.service';

// Estrategia separada de la de CompanyUser (nombre 'jwt-buyer' vs 'jwt') para no
// tocar ningún guard/ruta del backoffice existente — ver ADR-006.
@Injectable()
export class BuyerJwtStrategy extends PassportStrategy(Strategy, 'jwt-buyer') {
  constructor(
    private readonly config: ConfigService,
    private readonly buyersService: BuyersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') ?? 'change-me',
    });
  }

  async validate(payload: BuyerJwtPayload) {
    const buyer = await this.buyersService.findById(payload.sub);
    if (!buyer || !buyer.isActive) {
      throw new UnauthorizedException('Comprador inválido o inactivo');
    }
    return {
      id: buyer.id,
      email: buyer.email,
      firstName: buyer.firstName,
      lastName: buyer.lastName,
    };
  }
}
