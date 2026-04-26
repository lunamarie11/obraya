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

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    return this.buildAuthResponse(user);
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
