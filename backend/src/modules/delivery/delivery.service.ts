import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface RegisterDeliveryDto {
  userId: string;
  vehicleType: string;
  licensePlate?: string;
}

export interface UpdateDeliveryDto {
  vehicleType?: string;
  licensePlate?: string;
  isActive?: boolean;
}

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterDeliveryDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user || user.role !== 'DELIVERY') {
      throw new BadRequestException('Usuario no válido para delivery');
    }

    const existing = await this.prisma.delivery.findUnique({
      where: { userId: dto.userId },
    });

    if (existing) {
      throw new BadRequestException('Usuario ya registrado como delivery');
    }

    return this.prisma.delivery.create({
      data: {
        userId: dto.userId,
        vehicleType: dto.vehicleType,
        licensePlate: dto.licensePlate,
      },
      include: { user: true },
    });
  }

  async getProfile(userId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { userId },
      include: { user: true, orders: { include: { user: true, address: true } } },
    });

    if (!delivery) {
      throw new NotFoundException('Perfil de delivery no encontrado');
    }

    return delivery;
  }

  async updateProfile(userId: string, dto: UpdateDeliveryDto) {
    return this.prisma.delivery.update({
      where: { userId },
      data: dto,
    });
  }

  async getAvailableOrders() {
    return this.prisma.order.findMany({
      where: {
        status: 'PREPARING',
        deliveryId: null,
      },
      include: {
        user: { select: { name: true, phone: true } },
        address: true,
        items: { include: { product: { select: { name: true } } } },
      },
    });
  }

  async acceptOrder(deliveryId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.status !== 'PREPARING' || order.deliveryId) {
      throw new BadRequestException('Pedido no disponible');
    }

    // Calculate commission
    const commission = order.total * 0.1; // 10%

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryId,
        status: 'IN_TRANSIT',
        deliveryCommission: commission,
      },
      include: {
        user: { select: { name: true, phone: true } },
        address: true,
        items: { include: { product: { select: { name: true } } } },
      },
    });
  }

  async completeOrder(orderId: string, tip: number = 0) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        tip,
      },
    });
  }

  async getEarnings(userId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { userId },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery profile not found');
    }

    const orders = await this.prisma.order.findMany({
      where: {
        deliveryId: delivery.id,
        status: 'DELIVERED',
      },
    });

    const totalEarnings = orders.reduce((sum, order) => sum + order.deliveryCommission + order.tip, 0);
    const totalCommissions = orders.reduce((sum, order) => sum + order.deliveryCommission, 0);
    const totalTips = orders.reduce((sum, order) => sum + order.tip, 0);

    return {
      totalDeliveries: orders.length,
      totalEarnings,
      totalCommissions,
      totalTips,
      orders,
    };
  }
}
