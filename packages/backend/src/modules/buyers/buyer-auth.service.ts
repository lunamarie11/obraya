import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BuyersService } from './buyers.service';
import { Buyer } from './entities/buyer.entity';

export interface BuyerJwtPayload {
  sub: string; // buyerId
  email: string;
  type: 'buyer';
}

export interface BuyerAuthTokens {
  accessToken: string;
  refreshToken: string;
  buyer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

@Injectable()
export class BuyerAuthService {
  constructor(
    private readonly buyersService: BuyersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(buyer: Buyer): Promise<BuyerAuthTokens> {
    const payload: BuyerJwtPayload = {
      sub: buyer.id,
      email: buyer.email,
      type: 'buyer',
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

    await this.buyersService.updateLastLogin(buyer.id);

    return {
      accessToken,
      refreshToken,
      buyer: {
        id: buyer.id,
        email: buyer.email,
        firstName: buyer.firstName,
        lastName: buyer.lastName,
        phone: buyer.phone,
      },
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<BuyerJwtPayload>(token, {
        secret: this.config.get('jwt.refreshSecret'),
      });

      const buyer = await this.buyersService.findById(payload.sub);
      if (!buyer || !buyer.isActive) throw new UnauthorizedException('Comprador inválido');

      const newPayload: BuyerJwtPayload = {
        sub: buyer.id,
        email: buyer.email,
        type: 'buyer',
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
