import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
        environment: process.env.NODE_ENV || 'development',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
      };
    }
  }

  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        ready: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        ready: false,
        error: error.message,
      };
    }
  }

  async live() {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
    };
  }
}
