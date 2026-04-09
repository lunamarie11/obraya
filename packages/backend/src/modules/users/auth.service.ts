import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { CompanyUser } from './entities/company-user.entity';

export interface JwtPayload {
  sub: string;        // userId
  email: string;
  role: string;
  companyId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    companyId: string;
    companyStatus: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<CompanyUser> {
    const user = await this.usersService.findUserByEmail(email);

    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    if (!user.isActive) throw new UnauthorizedException('Usuario inactivo');
    if (!user.company) throw new UnauthorizedException('Empresa no encontrada');

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) throw new UnauthorizedException('Credenciales inválidas');

    return user;
  }

  async login(user: CompanyUser): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
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

    await this.usersService.updateLastLogin(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId,
        companyStatus: user.company.status,
      },
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.config.get('jwt.refreshSecret'),
      });

      const user = await this.usersService.findUserById(payload.sub);
      if (!user || !user.isActive) throw new UnauthorizedException('Usuario inválido');

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
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
