import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, ILike } from 'typeorm';
import { Order, OrderStatus, VALID_TRANSITIONS } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderMessage, MessageSender } from './entities/order-message.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { StockService } from '../stock/stock.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(OrderMessage)
    private readonly messageRepo: Repository<OrderMessage>,
    private readonly dataSource: DataSource,
    private readonly stockService: StockService,
  ) {}

  private generateOrderNumber(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `OBY-${ts}-${rand}`;
  }

  async findAll(companyId: string, query: OrderQueryDto) {
    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.companyId = :companyId', { companyId });

    if (query.status) qb.andWhere('order.status = :status', { status: query.status });

    if (query.search) {
      qb.andWhere(
        '(order.orderNumber ILIKE :search OR order.buyerName ILIKE :search OR order.buyerEmail ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.dateFrom) qb.andWhere('order.createdAt >= :dateFrom', { dateFrom: query.dateFrom });
    if (query.dateTo) qb.andWhere('order.createdAt <= :dateTo', { dateTo: query.dateTo + 'T23:59:59' });

    const [orders, total] = await qb
      .orderBy('order.createdAt', 'DESC')
      .skip(((query.page ?? 1) - 1) * (query.limit ?? 20))
      .take(query.limit ?? 20)
      .getManyAndCount();

    return {
      data: orders,
      total,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      totalPages: Math.ceil(total / (query.limit ?? 20)),
    };
  }

  async findOne(id: string, companyId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id, companyId },
      relations: ['items', 'messages'],
      order: { messages: { createdAt: 'ASC' } },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async create(companyId: string, buyerId: string, dto: CreateOrderDto): Promise<Order> {
    if (!dto.items?.length) {
      throw new BadRequestException('El pedido debe contener al menos un item');
    }

    const items: OrderItem[] = dto.items.map((item) => {
      const unitPrice = item.unitPrice ?? 0;
      return this.itemRepo.create({
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        unitPrice,
        subtotal: Math.round(unitPrice * item.quantity),
        discountPercent: item.discountPercent ?? 0,
        notes: item.notes,
      });
    });

    const totalAmount = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

    const order = this.orderRepo.create({
      companyId,
      buyerId,
      buyerName: dto.buyerName,
      buyerEmail: dto.buyerEmail,
      buyerPhone: dto.buyerPhone,
      orderNumber: this.generateOrderNumber(),
      status: OrderStatus.NUEVO,
      items,
      totalAmount,
      currency: 'ARS',
      notes: dto.notes,
      deliveryAddress: dto.deliveryAddress,
    });

    return this.orderRepo.save(order);
  }

  // Ver ADR-006: el comprador crea el pedido para el fabricante indicado en
  // dto.companyId (el carrito ya viene agrupado por companyId desde el frontend).
  async createForBuyer(buyerId: string, dto: CreateOrderDto): Promise<Order> {
    return this.create(dto.companyId, buyerId, dto);
  }

  async findAllForBuyer(buyerId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { buyerId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForBuyer(id: string, buyerId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id, buyerId },
      relations: ['items', 'messages'],
      order: { messages: { createdAt: 'ASC' } },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async updateStatus(
    id: string,
    companyId: string,
    dto: UpdateOrderStatusDto,
    userId: string,
    userName: string,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const messageRepo = manager.getRepository(OrderMessage);

      const order = await orderRepo.findOne({
        where: { id, companyId },
        relations: ['items'],
      });
      if (!order) throw new NotFoundException('Pedido no encontrado');

      // Validar transición
      const validNext = VALID_TRANSITIONS[order.status];
      if (!validNext.includes(dto.status)) {
        throw new BadRequestException(
          `No se puede pasar de "${order.status}" a "${dto.status}". Transiciones válidas: ${validNext.join(', ') || 'ninguna'}`,
        );
      }

      // Cancelación requiere motivo
      if (dto.status === OrderStatus.CANCELADO && !dto.rejectionReason) {
        throw new BadRequestException('El motivo de cancelación es obligatorio');
      }

      // Al aceptar: reservar stock
      if (dto.status === OrderStatus.ACEPTADO) {
        for (const item of order.items) {
          await this.stockService.updateStock(
            item.productId,
            companyId,
            {
              quantity: 0, // lo maneja internamente como reserva
              notes: `Reserva pedido ${order.orderNumber}`,
            },
            userId,
          );
        }
      }

      // Al cancelar: liberar stock si estaba reservado
      if (dto.status === OrderStatus.CANCELADO && order.status !== OrderStatus.NUEVO) {
        // En v2 implementar liberación de reserva con MovementType.LIBERACION
      }

      // Al entregar: registrar fecha real
      if (dto.status === OrderStatus.ENTREGADO) {
        order.actualDeliveryDate = new Date();
      }

      if (dto.scheduledDeliveryDate) {
        order.scheduledDeliveryDate = new Date(dto.scheduledDeliveryDate);
      }

      order.status = dto.status;
      if (dto.rejectionReason) order.rejectionReason = dto.rejectionReason;

      await orderRepo.save(order);

      // Mensaje de sistema automático con el cambio de estado
      const systemMsg = dto.status === OrderStatus.CANCELADO
        ? `Pedido cancelado. Motivo: ${dto.rejectionReason}`
        : `Estado actualizado a: ${dto.status}`;

      await messageRepo.save(
        messageRepo.create({
          orderId: id,
          sender: MessageSender.SYSTEM,
          senderId: userId,
          senderName: userName,
          content: systemMsg,
          isPredefined: false,
        }),
      );

      return orderRepo.findOne({ where: { id }, relations: ['items', 'messages'] }) as Promise<Order>;
    });
  }

  async sendMessage(
    id: string,
    companyId: string,
    dto: SendMessageDto,
    userId: string,
    userName: string,
  ): Promise<OrderMessage> {
    const order = await this.orderRepo.findOne({ where: { id, companyId } });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    if (order.status === OrderStatus.ENTREGADO || order.status === OrderStatus.CANCELADO) {
      throw new BadRequestException('No se pueden enviar mensajes en pedidos finalizados');
    }

    return this.messageRepo.save(
      this.messageRepo.create({
        orderId: id,
        sender: MessageSender.COMPANY,
        senderId: userId,
        senderName: userName,
        content: dto.content,
        isPredefined: dto.isPredefined ?? false,
      }),
    );
  }

  // Resumen para dashboard — usado por DashboardService
  async getSummary(companyId: string, from: Date, to: Date) {
    const orders = await this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.companyId = :companyId', { companyId })
      .andWhere('order.status != :cancelled', { cancelled: OrderStatus.CANCELADO })
      .andWhere('order.createdAt BETWEEN :from AND :to', { from, to })
      .getMany();

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const avgTicket = orders.length ? Math.round(totalRevenue / orders.length) : 0;

    // Top 10 productos por cantidad vendida
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const order of orders) {
      for (const item of order.items) {
        const existing = productMap.get(item.productId) ?? { name: item.productName, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += Number(item.subtotal);
        productMap.set(item.productId, existing);
      }
    }
    const topProducts = [...productMap.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10)
      .map(([productId, data]) => ({ productId, ...data }));

    return {
      totalOrders: orders.length,
      totalRevenue,
      avgTicket,
      topProducts,
      byStatus: {
        nuevo: orders.filter((o) => o.status === OrderStatus.NUEVO).length,
        aceptado: orders.filter((o) => o.status === OrderStatus.ACEPTADO).length,
        preparacion: orders.filter((o) => o.status === OrderStatus.PREPARACION).length,
        despachado: orders.filter((o) => o.status === OrderStatus.DESPACHADO).length,
        entregado: orders.filter((o) => o.status === OrderStatus.ENTREGADO).length,
      },
    };
  }
}
