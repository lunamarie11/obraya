import { Controller, Post, Body, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Order, OrderStatus, VALID_TRANSITIONS } from '../orders/entities/order.entity';
import { OrderMessage, MessageSender } from '../orders/entities/order-message.entity';
import { PaymentsService } from './payments.service';

// Ver ADR-007: el webhook de Mercado Pago solo actualiza el estado del pago
// (paymentStatus/mpPaymentId). No fuerza transiciones del estado del pedido
// (Nuevo→Aceptado→...), salvo el caso de pago rechazado: ahí sí cancelamos
// automáticamente el pedido si todavía está en Nuevo (nadie lo aceptó aún).
@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly payments: PaymentsService,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderMessage)
    private readonly messageRepo: Repository<OrderMessage>,
  ) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook de notificaciones de Mercado Pago' })
  async webhook(@Body() body: any) {
    this.logger.log(`MP Webhook: type=${body?.type} id=${body?.data?.id}`);

    if (body?.type !== 'payment' || !body?.data?.id) {
      return { ok: true };
    }

    try {
      const info = await this.payments.getPaymentInfo(String(body.data.id));
      const orderId = info.external_reference;
      if (!orderId) return { ok: true };

      const order = await this.orderRepo.findOne({ where: { id: orderId } });
      if (!order) {
        this.logger.warn(`Webhook MP: pedido ${orderId} no encontrado`);
        return { ok: true };
      }

      order.mpPaymentId = String(body.data.id);
      if (info.status) order.paymentStatus = info.status;

      let systemMsg: string | null = null;

      if (info.status === 'approved') {
        systemMsg = 'Pago acreditado vía Mercado Pago';
      } else if (info.status === 'rejected') {
        if (order.status === OrderStatus.NUEVO && VALID_TRANSITIONS[order.status].includes(OrderStatus.CANCELADO)) {
          order.status = OrderStatus.CANCELADO;
          order.rejectionReason = 'Pago rechazado por Mercado Pago';
          systemMsg = 'Pago rechazado — pedido cancelado automáticamente';
        } else {
          systemMsg = 'Pago rechazado vía Mercado Pago';
        }
      } else if (info.status === 'pending' || info.status === 'in_process') {
        systemMsg = 'Pago en proceso vía Mercado Pago';
      }

      await this.orderRepo.save(order);

      if (systemMsg) {
        await this.messageRepo.save(
          this.messageRepo.create({
            orderId: order.id,
            sender: MessageSender.SYSTEM,
            content: systemMsg,
            isPredefined: false,
          }),
        );
      }
    } catch (err) {
      this.logger.error('Error procesando webhook de Mercado Pago', err as Error);
    }

    return { ok: true };
  }
}
