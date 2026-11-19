import {
  Inject,
  forwardRef,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, ILike } from 'typeorm';
import { Order, OrderStatus, PaymentMethod, VALID_TRANSITIONS } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderMessage, MessageSender } from './entities/order-message.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { StockService } from '../stock/stock.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { BuyersService } from '../buyers/buyers.service';
import { AfipService } from '../afip/afip.service';
import { DriversService } from '../logistics/drivers.service';
import { GoogleMapsService } from '../logistics/google-maps.service';
import { LogisticsService } from '../logistics/logistics.service';
import { Company, resolveDeliveryZone } from '../users/entities/company.entity';
import { UserRole } from '../users/entities/company-user.entity';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(OrderMessage)
    private readonly messageRepo: Repository<OrderMessage>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly dataSource: DataSource,
    private readonly stockService: StockService,
    private readonly paymentsService: PaymentsService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly buyersService: BuyersService,
    private readonly afipService: AfipService,
    @Inject(forwardRef(() => DriversService))
    private readonly driversService: DriversService,
    private readonly googleMapsService: GoogleMapsService,
    // Ver ADR-027: GoogleMapsService no depende de nada circular (solo
    // ConfigService), pero LogisticsService si -- mismo forwardRef que ya
    // usa DriversService, porque LogisticsModule.forwardRef(OrdersModule)
    // ya cierra el ciclo del otro lado.
    @Inject(forwardRef(() => LogisticsService))
    private readonly logisticsService: LogisticsService,
  ) {}

  private generateOrderNumber(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `OBY-${ts}-${rand}`;
  }

  // Comprador y delivery independiente no deben ver el desglose financiero
  // interno de ObraYa (comisión propia, fee de MP, neto que recibe la
  // empresa) — solo el backoffice del fabricante lo necesita.
  private hideFinancials(order: Order): Order {
    const { platformCommissionAmount, mpFeeAmount, netAmountToCompany, ...rest } = order;
    return rest as Order;
  }

  private hideFinancialsAll(orders: Order[]): Order[] {
    return orders.map((o) => this.hideFinancials(o));
  }

  async findAll(companyId: string, query: OrderQueryDto, currentUserId?: string) {
    const qb = this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .where('order.companyId = :companyId', { companyId });

    if (query.status) qb.andWhere('order.status = :status', { status: query.status });

    // Ver ADR-017: cola de reparto separada en "disponibles" vs "mis pedidos".
    // assignedToMe se resuelve siempre contra el usuario autenticado, nunca
    // contra un id arbitrario recibido por query string.
    if (query.unassigned) qb.andWhere('order.assignedDriverId IS NULL');
    if (query.assignedToMe) qb.andWhere('order.assignedDriverId = :currentUserId', { currentUserId });

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

    const itemsTotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);

    // Costo de envío resuelto server-side (ver ADR-012): nunca se confía en
    // un shippingCost enviado por el cliente. Si la empresa no configuró
    // zonas o el código postal no matchea ninguna, el envío queda en 0 y no
    // bloquea la creación del pedido.
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    const zone = resolveDeliveryZone(company?.deliveryZones, dto.deliveryAddress?.postalCode);
    const shippingCost = zone?.shippingCost ?? 0;
    const totalAmount = itemsTotal + shippingCost;

    // Comisión de ObraYa: % sobre itemsTotal (la venta en sí, sin contar el
    // envío, que es un costo logístico que pasa íntegro al fabricante/flota).
    // Se calcula con el % vigente de la empresa al momento del pedido para
    // que cambios futuros en platformCommissionPercent no afecten pedidos ya creados.
    const commissionPercent = company?.platformCommissionPercent ?? 4;
    const platformCommissionAmount = Math.round((itemsTotal * commissionPercent) / 100);

    // El fee de MercadoPago no se conoce hasta que el webhook confirma el
    // pago; para Efectivo/Transferencia no hay fee y el neto se calcula ya.
    const paymentMethod = dto.paymentMethod ?? PaymentMethod.EFECTIVO;
    const mpFeeAmount = paymentMethod === PaymentMethod.MERCADO_PAGO ? null : 0;
    const netAmountToCompany =
      paymentMethod === PaymentMethod.MERCADO_PAGO ? null : totalAmount - platformCommissionAmount;

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
      shippingCost,
      shippingZoneName: zone?.name,
      currency: 'ARS',
      notes: dto.notes,
      deliveryAddress: dto.deliveryAddress,
      paymentMethod,
      platformCommissionAmount,
      mpFeeAmount,
      netAmountToCompany,
    });

    const saved = await this.orderRepo.save(order);

    // Ver ADR-007: con Mercado Pago generamos la preferencia de pago recién
    // creado el pedido y guardamos el link de pago para que el comprador lo use.
    if (saved.paymentMethod === PaymentMethod.MERCADO_PAGO) {
      try {
        const preference = await this.paymentsService.createPreference({
          id: saved.id,
          orderNumber: saved.orderNumber,
          items: [
            ...saved.items.map((item) => ({
              name: item.productName,
              qty: item.quantity,
              price: item.unitPrice,
            })),
            ...(saved.shippingCost > 0
              ? [{ name: `Envío${saved.shippingZoneName ? ` (${saved.shippingZoneName})` : ''}`, qty: 1, price: saved.shippingCost }]
              : []),
          ],
          payerEmail: saved.buyerEmail,
        });
        saved.mpPreferenceId = preference.preferenceId;
        saved.paymentUrl = preference.initPoint;
        await this.orderRepo.save(saved);
      } catch (err) {
        // No bloqueamos la creación del pedido si Mercado Pago falla; el fabricante
        // y el comprador pueden coordinar el pago por otro medio.
        this.logger.warn(`No se pudo crear la preferencia de MP para ${saved.orderNumber}: ${(err as Error).message}`);
      }
    }

    return saved;
  }

  // Ver ADR-006: el comprador crea el pedido para el fabricante indicado en
  // dto.companyId (el carrito ya viene agrupado por companyId desde el frontend).
  async createForBuyer(buyerId: string, dto: CreateOrderDto): Promise<Order> {
    const order = await this.create(dto.companyId, buyerId, dto);
    return this.hideFinancials(order);
  }

  async findAllForBuyer(buyerId: string): Promise<Order[]> {
    const orders = await this.orderRepo.find({
      where: { buyerId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
    return this.hideFinancialsAll(orders);
  }

  async findOneForBuyer(id: string, buyerId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id, buyerId },
      relations: ['items', 'messages'],
      order: { messages: { createdAt: 'ASC' } },
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return this.hideFinancials(order);
  }

  // Ver ADR-027 / fase4e: tracking en tiempo real para el comprador, que
  // ADR-018 habia dejado explicitamente fuera de alcance. Devuelve null
  // (no 404 -- eso lo decide el controller) si el pedido todavia no esta
  // Despachado, no tiene repartidor asignado, o el repartidor asignado aun
  // no reporto ninguna posicion -- en todos esos casos el frontend cae al
  // stepper textual existente, sin mapa.
  async getTrackingForBuyer(
    id: string,
    buyerId: string,
  ): Promise<{
    driverLat: number;
    driverLng: number;
    routePolyline: string | null;
    routeDistanceMeters: number | null;
    routeDurationSeconds: number | null;
  } | null> {
    const order = await this.orderRepo.findOne({ where: { id, buyerId } });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    if (order.status !== OrderStatus.DESPACHADO) return null;
    if (!order.assignedDriverId && !order.assignedDeliveryId) return null;

    const location = await this.logisticsService.getLocationForAssignment(
      order.assignedDriverId,
      order.assignedDeliveryId,
    );
    if (!location) return null;

    return {
      driverLat: location.lat,
      driverLng: location.lng,
      routePolyline: order.routePolyline,
      routeDistanceMeters: order.routeDistanceMeters,
      routeDurationSeconds: order.routeDurationSeconds,
    };
  }

  // Ver ADR-017: reclama un pedido Despachado sin repartidor asignado. Update
  // atómico y condicional (no read-then-write) para que dos repartidores que
  // intenten tomar el mismo pedido a la vez no puedan asignárselo ambos: solo
  // uno de los dos UPDATE afecta una fila, el otro recibe affected = 0.
  async claimOrder(id: string, companyId: string, userId: string): Promise<Order> {
    // Ver fase4c-entidad-driver.md: un repartidor que se marcó no disponible
    // no puede reclamar pedidos nuevos (sí puede seguir liberando/entregando
    // los que ya tenía, eso no se chequea acá).
    if (!(await this.driversService.isAvailable(userId))) {
      throw new ForbiddenException('Marcate disponible para tomar pedidos antes de reclamar uno');
    }

    const result = await this.orderRepo
      .createQueryBuilder()
      .update(Order)
      .set({ assignedDriverId: userId, assignedAt: () => 'now()' })
      // Ver ADR-026: "assigned_delivery_id IS NULL" evita que un repartidor
      // interno tome un pedido que ya se llevó un delivery independiente
      // (que reclama marketplace-wide, sin el filtro de company_id de acá).
      .where(
        'id = :id AND company_id = :companyId AND status = :status AND assigned_driver_id IS NULL AND assigned_delivery_id IS NULL',
        {
          id,
          companyId,
          status: OrderStatus.DESPACHADO,
        },
      )
      .execute();

    if (!result.affected) {
      const exists = await this.orderRepo.findOne({ where: { id, companyId } });
      if (!exists) throw new NotFoundException('Pedido no encontrado');
      throw new ConflictException('Este pedido ya fue tomado por otro repartidor');
    }

    return this.orderRepo.findOne({ where: { id, companyId }, relations: ['items'] }) as Promise<Order>;
  }

  // Ver ADR-026: pedidos Despachados disponibles para CUALQUIER delivery
  // independiente del marketplace (sin filtro de company_id, a diferencia
  // de claimOrder/findAll que son siempre de una sola empresa).
  async findAvailableForDelivery(): Promise<Order[]> {
    const orders = await this.orderRepo.find({
      where: { status: OrderStatus.DESPACHADO, assignedDriverId: undefined, assignedDeliveryId: undefined },
      relations: ['items'],
      order: { createdAt: 'ASC' },
    });
    return this.hideFinancialsAll(orders.filter((o) => !o.assignedDriverId && !o.assignedDeliveryId));
  }

  async findAllForDelivery(deliveryId: string): Promise<Order[]> {
    const orders = await this.orderRepo.find({
      where: { assignedDeliveryId: deliveryId },
      relations: ['items'],
      order: { assignedDeliveryAt: 'DESC' },
    });
    return this.hideFinancialsAll(orders);
  }

  // Mismo patrón de UPDATE atómico condicional que claimOrder, pero sin
  // scope de empresa (ver ADR-026): un delivery independiente puede
  // reclamar el pedido de cualquier fabricante.
  async claimOrderForDelivery(id: string, deliveryId: string): Promise<Order> {
    const result = await this.orderRepo
      .createQueryBuilder()
      .update(Order)
      .set({ assignedDeliveryId: deliveryId, assignedDeliveryAt: () => 'now()' })
      .where(
        'id = :id AND status = :status AND assigned_driver_id IS NULL AND assigned_delivery_id IS NULL',
        { id, status: OrderStatus.DESPACHADO },
      )
      .execute();

    if (!result.affected) {
      const exists = await this.orderRepo.findOne({ where: { id } });
      if (!exists) throw new NotFoundException('Pedido no encontrado');
      throw new ConflictException('Este pedido ya fue tomado por otro repartidor');
    }

    const claimed = await this.orderRepo.findOne({ where: { id }, relations: ['items'] });
    return this.hideFinancials(claimed as Order);
  }

  async unassignOrderForDelivery(id: string, deliveryId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    if (order.assignedDeliveryId !== deliveryId) {
      throw new ForbiddenException('Este pedido esta asignado a otro repartidor');
    }

    order.assignedDeliveryId = null;
    order.assignedDeliveryAt = null;
    const saved = await this.orderRepo.save(order);
    return this.hideFinancials(saved);
  }

  // Marca Entregado un pedido reclamado por un delivery independiente.
  // Reusa la misma validación de transición que updateStatus, pero sin
  // companyId (el delivery no pertenece a ninguna empresa, ver ADR-026).
  async markDeliveredByDelivery(id: string, deliveryId: string, deliveryName: string): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id }, relations: ['items'] });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    if (order.assignedDeliveryId !== deliveryId) {
      throw new ForbiddenException('Este pedido esta asignado a otro repartidor');
    }

    const validNext = VALID_TRANSITIONS[order.status];
    if (!validNext.includes(OrderStatus.ENTREGADO)) {
      throw new BadRequestException(
        `No se puede pasar de "${order.status}" a "${OrderStatus.ENTREGADO}"`,
      );
    }

    order.status = OrderStatus.ENTREGADO;
    order.actualDeliveryDate = new Date();
    const saved = await this.orderRepo.save(order);

    // Ver updateStatus: ahi se genera un mensaje de sistema por cada cambio
    // de estado, pero este metodo (flujo de delivery independiente, ADR-026)
    // no pasaba por esa transaccion y se habia quedado sin el suyo -- bug
    // encontrado por QA (el pedido quedaba "Entregado" sin avisarle nada al
    // comprador en el chat del pedido).
    await this.messageRepo.save(
      this.messageRepo.create({
        orderId: id,
        sender: MessageSender.SYSTEM,
        senderId: deliveryId,
        senderName: deliveryName,
        content: `Estado actualizado a: ${OrderStatus.ENTREGADO}`,
        isPredefined: false,
      }),
    );

    // Antes este flujo no avisaba al comprador ni por push ni por mail.
    this.notifyBuyer(saved, OrderStatus.ENTREGADO);

    return this.hideFinancials(saved);
  }

  // Push + email al comprador en cada cambio de estado (ver ADR-011).
  // Best-effort y sin await: nunca bloquea ni hace fallar el cambio de estado.
  // El mail lleva el detalle del pedido (bug #10 de QA del 18/11).
  private notifyBuyer(order: Order, status: OrderStatus): void {
    Promise.all([
      this.buyersService.findById(order.buyerId),
      this.companyRepo.findOne({ where: { id: order.companyId } }).catch(() => null),
    ])
      .then(([buyer, company]) => {
        this.notificationsService.notifyOrderStatus(buyer?.fcmToken, order.orderNumber, status);
        const to = buyer?.email || order.buyerEmail;
        if (!to) return;
        return this.emailService.sendOrderStatusEmail(to, {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status,
          buyerFirstName: buyer?.firstName ?? order.buyerName?.split(' ')[0] ?? null,
          companyName: company?.razonSocial || null,
          items: (order.items ?? []).map((i) => ({
            productName: i.productName,
            quantity: i.quantity,
            subtotal: i.subtotal,
          })),
          shippingCost: order.shippingCost,
          totalAmount: order.totalAmount,
          deliveryAddress: order.deliveryAddress,
          date: status === OrderStatus.ENTREGADO && order.actualDeliveryDate ? order.actualDeliveryDate : new Date(),
          rejectionReason: order.rejectionReason,
        });
      })
      .catch((err) => this.logger.warn(`No se pudo notificar al comprador ${order.buyerId}: ${(err as Error).message}`));
  }

  // Ver ADR-018 (extendido en ADR-027/fase4e): usado por LogisticsService
  // para saber que repartidores tienen un pedido activo asignado en este
  // momento, sin que el modulo de logistica acceda directamente al
  // repositorio de Order (comunicacion entre modulos via inyeccion de
  // dependencias, ver CLAUDE.md). Incluye tanto repartidor interno
  // (assignedDriverId) como delivery independiente (assignedDeliveryId,
  // ADR-026) -- un pedido tiene a lo sumo uno de los dos.
  async findActiveAssignments(
    companyId: string,
  ): Promise<{ orderId: string; orderNumber: string; assignedDriverId: string | null; assignedDeliveryId: string | null }[]> {
    const orders = await this.orderRepo.find({
      where: { companyId, status: OrderStatus.DESPACHADO },
    });
    return orders
      .filter((o) => !!o.assignedDriverId || !!o.assignedDeliveryId)
      .map((o) => ({
        orderId: o.id,
        orderNumber: o.orderNumber,
        assignedDriverId: o.assignedDriverId,
        assignedDeliveryId: o.assignedDeliveryId,
      }));
  }

  // Libera un pedido asignado sin cambiar su status. Logistica solo puede
  // liberar los suyos; Admin puede destrabar cualquiera (override manual).
  async unassignOrder(id: string, companyId: string, userId: string, userRole: UserRole): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id, companyId } });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    if (userRole === UserRole.LOGISTICA && order.assignedDriverId !== userId) {
      throw new ForbiddenException('Este pedido esta asignado a otro repartidor');
    }

    order.assignedDriverId = null;
    order.assignedAt = null;
    return this.orderRepo.save(order);
  }

  async updateStatus(
    id: string,
    companyId: string,
    dto: UpdateOrderStatusDto,
    userId: string,
    userName: string,
    userRole?: UserRole,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const messageRepo = manager.getRepository(OrderMessage);

      const order = await orderRepo.findOne({
        where: { id, companyId },
        relations: ['items'],
      });
      if (!order) throw new NotFoundException('Pedido no encontrado');

      // Ver ADR-017: un repartidor (Logistica) solo puede marcar como
      // entregado un pedido que el mismo reclamó. Admin/Vendedor mantienen
      // el comportamiento previo (override), no participan del flujo de
      // asignación.
      if (
        dto.status === OrderStatus.ENTREGADO &&
        userRole === UserRole.LOGISTICA &&
        order.assignedDriverId !== userId
      ) {
        throw new ForbiddenException('Este pedido esta asignado a otro repartidor');
      }

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

      // Stock (ver StockService.applyOrderMovement): Aceptado reserva,
      // Despachado descuenta, Cancelado después de Aceptado libera la reserva.
      // Misma transacción que el cambio de estado.
      const stockKind =
        dto.status === OrderStatus.ACEPTADO
          ? 'reserve'
          : dto.status === OrderStatus.DESPACHADO
            ? 'consume'
            : dto.status === OrderStatus.CANCELADO && order.status !== OrderStatus.NUEVO
              ? 'release'
              : null;
      if (stockKind) {
        await this.stockService.applyOrderMovement(
          manager,
          stockKind,
          order.items ?? [],
          { id: order.id, orderNumber: order.orderNumber },
          userId,
        );
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

      // Al despachar: emitir factura electrónica AFIP (ver ADR-010). Es el
      // estado más cercano al movimiento real de la mercadería y solo
      // transiciona a Entregado, así que no hay riesgo de tener que anular
      // la factura por una cancelación posterior. Best-effort: si AFIP no
      // está configurado o falla, no bloquea el cambio de estado del pedido.
      if (dto.status === OrderStatus.DESPACHADO) {
        const company = await manager.getRepository(Company).findOne({ where: { id: companyId } });

        try {
          const invoice = company ? await this.afipService.createInvoice({ order, company }) : null;
          if (invoice) {
            order.afipCae = invoice.cae;
            order.afipCaeExpiration = invoice.caeExpiration;
            order.afipInvoiceNumber = invoice.invoiceNumber;
            order.afipInvoiceType = invoice.invoiceType;
            order.afipStatus = 'emitida';
          }
        } catch (err) {
          order.afipStatus = 'error';
          this.logger.warn(`No se pudo emitir factura AFIP para ${order.orderNumber}: ${(err as Error).message}`);
        }

        // Ruta de Google Maps para tracking (ver ADR-027 /
        // fase4e-tracking-google-maps.md). Origen y destino se pasan como
        // texto libre -- Directions API geocodea internamente, no hace
        // falta agregar Geocoding API aparte. Se calcula UNA sola vez (no
        // se recalcula en cada poll de posicion) para no multiplicar el
        // costo por el polling. Best-effort: si falla, el pedido se
        // despacha igual, solo sin ruta dibujada.
        try {
          const destination = order.deliveryAddress
            ? [order.deliveryAddress.street, order.deliveryAddress.city, order.deliveryAddress.province]
                .filter(Boolean)
                .join(', ')
            : null;
          const route =
            company?.address && destination
              ? await this.googleMapsService.calculateRoute(company.address, destination)
              : null;
          if (route) {
            order.routePolyline = route.polyline;
            order.routeDistanceMeters = route.distanceMeters;
            order.routeDurationSeconds = route.durationSeconds;
            order.routeCalculatedAt = new Date();
          }
        } catch (err) {
          this.logger.warn(
            `No se pudo calcular la ruta de Google Maps para ${order.orderNumber}: ${(err as Error).message}`,
          );
        }
      }

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

      const updated = await orderRepo.findOne({ where: { id }, relations: ['items', 'messages'] }) as Order;

      this.notifyBuyer(updated, dto.status);

      return updated;
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
