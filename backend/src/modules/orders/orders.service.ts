import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string) {
    return this.prisma.order.findMany({
      where: userId ? { userId } : undefined,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: { select: { name: true, emoji: true, brand: true } } } },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        address: true,
        tracking: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async getTracking(id: string) {
    const order = await this.findOne(id);
    return order.tracking;
  }

  async create(dto: CreateOrderDto) {
    const subtotal = dto.items.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping = subtotal >= 50000 ? 0 : 3500;
    const total = subtotal + shipping;
    const orderNumber = `OBY-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

    return this.prisma.order.create({
      data: {
        orderNumber,
        userId: dto.userId,
        addressId: dto.addressId,
        subtotal,
        shipping,
        total,
        paymentMethod: dto.paymentMethod,
        notes: dto.notes,
        items: {
          create: dto.items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            price: i.price,
            subtotal: i.price * i.qty,
          })),
        },
        tracking: {
          create: { status: OrderStatus.PENDING, message: 'Pedido recibido y pendiente de confirmación' },
        },
      },
      include: { items: true, tracking: true },
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    await this.findOne(id);
    const messages: Record<string, string> = {
      CONFIRMED: 'Pago acreditado — pedido confirmado',
      PREPARING: 'Tu pedido está siendo preparado en el depósito',
      IN_TRANSIT: 'Tu pedido está en camino',
      DELIVERED: '¡Pedido entregado con éxito!',
      CANCELLED: 'Pedido cancelado',
    };

    return this.prisma.order.update({
      where: { id },
      data: {
        status,
        tracking: {
          create: { status, message: messages[status] ?? '' },
        },
      },
    });
  }
}
