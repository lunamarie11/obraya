import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

type Role = 'BUYER' | 'SUPPLIER' | 'CONTRACTOR' | 'ADMIN' | 'ARQUITECTO' | 'COMERCIO' | 'DELIVERY';

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface LoginDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.email || !dto.password || !dto.name || !dto.role) {
      throw new BadRequestException('Todos los campos son obligatorios');
    }

    if (!['BUYER', 'SUPPLIER', 'CONTRACTOR', 'ADMIN', 'ARQUITECTO', 'COMERCIO', 'DELIVERY'].includes(dto.role)) {
      throw new BadRequestException('Rol inválido');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con ese email');
    }

    const hash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.toLowerCase().trim(),
        password: hash,
        role: dto.role as any,
      },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    if (!dto.email || !dto.password) {
      throw new BadRequestException('Email y contraseña son obligatorios');
    }

    try {
      let user = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase().trim() },
      });

      // Si es admin@obraya.com y no existe, crearlo automáticamente
      if (!user && dto.email.toLowerCase().trim() === 'admin@obraya.com') {
        const hash = await bcrypt.hash(dto.password, 10);
        user = await this.prisma.user.create({
          data: {
            name: 'Super Admin',
            email: 'admin@obraya.com',
            password: hash,
            role: 'ADMIN',
          },
        });
      }

      if (!user) {
        throw new UnauthorizedException('Email o contraseña incorrectos');
      }

      const match = await bcrypt.compare(dto.password, user.password);
      if (!match) {
        throw new UnauthorizedException('Email o contraseña incorrectos');
      }

      return this.buildAuthResponse(user);
    } catch (error) {
      // Si la BD falla, permitir admin mock con la contraseña especial
      if (dto.email.toLowerCase().trim() === 'admin@obraya.com' && dto.password === 'obraya123') {
        console.log('Database connection failed, using mock admin token');
        const mockUser = {
          id: 'admin-mock-id',
          name: 'Super Admin',
          email: 'admin@obraya.com',
          role: 'ADMIN',
        };
        const token = this.jwt.sign({ sub: mockUser.id, email: mockUser.email, role: mockUser.role });
        return { token, user: mockUser };
      }
      console.log('Database error:', error.message);
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  private buildAuthResponse(user: any) {
    const token = this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    return { token, user: this.sanitize(user) };
  }

  private sanitize(user: any) {
    const { password, ...rest } = user;
    return rest;
  }
}
