import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users.service';
import { JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') ?? 'change-me',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findUserById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario inválido o inactivo');
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };
  }
}
