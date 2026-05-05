import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private payments: PaymentsService,
    private notifications: NotificationsService,
  ) {}

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

    const order = await this.prisma.order.create({
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
      include: {
        items: { include: { product: { select: { name: true } } } },
        tracking: true,
        user: { select: { email: true, fcmToken: true } },
      },
    });

    // MercadoPago preference
    if (dto.paymentMethod === 'MERCADO_PAGO') {
      try {
        const pref = await this.payments.createPreference({
          id: order.id,
          orderNumber,
          items: order.items.map((i) => ({
            name: (i as any).product?.name ?? 'Producto',
            qty: i.qty,
            price: i.price,
          })),
          total,
          payerEmail: (order as any).user?.email ?? 'comprador@obraya.com',
        });

        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            mpPreferenceId: pref.preferenceId,
            paymentUrl: pref.initPoint,
            paymentStatus: 'pending',
          },
        });

        return { ...order, paymentUrl: pref.initPoint, mpPreferenceId: pref.preferenceId };
      } catch {
        // Si MP falla, devolvemos la orden igual (sin bloquear)
      }
    }

    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { user: { select: { fcmToken: true } } },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    const messages: Record<string, string> = {
      CONFIRMED:  'Pago acreditado — pedido confirmado',
      PREPARING:  'Tu pedido está siendo preparado en el depósito',
      IN_TRANSIT: 'Tu pedido está en camino',
      DELIVERED:  '¡Pedido entregado con éxito!',
      CANCELLED:  'Pedido cancelado',
    };

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        tracking: { create: { status, message: messages[status] ?? '' } },
      },
    });

    // Push notification
    await this.notifications.notifyOrderStatus(
      (order as any).user?.fcmToken,
      order.orderNumber,
      status,
    );

    return updated;
  }
}
