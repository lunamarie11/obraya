import { Controller, Post, Body, Headers, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private payments: PaymentsService,
    private prisma: PrismaService,
  ) {}

  @Post('webhook')
  async webhook(
    @Body() body: any,
    @Headers('x-signature') signature: string,
  ) {
    this.logger.log(`MP Webhook: type=${body?.type} id=${body?.data?.id}`);

    if (body?.type === 'payment' && body?.data?.id) {
      try {
        const info = await this.payments.getPaymentInfo(String(body.data.id));
        const orderId = info.external_reference;

        if (!orderId) return { ok: true };

        const statusMap: Record<string, string> = {
          approved: 'CONFIRMED',
          rejected: 'CANCELLED',
          pending: 'PENDING',
          in_process: 'PENDING',
        };

        const newStatus = statusMap[info.status ?? ''];
        if (newStatus) {
          await this.prisma.order.update({
            where: { id: orderId },
            data: {
              mpPaymentId: String(body.data.id),
              paymentStatus: info.status,
              status: newStatus as any,
            },
          });

          await this.prisma.tracking.create({
            data: {
              orderId,
              status: newStatus as any,
              message:
                newStatus === 'CONFIRMED'
                  ? 'Pago acreditado via Mercado Pago'
                  : newStatus === 'CANCELLED'
                    ? 'Pago rechazado — pedido cancelado'
                    : 'Pago en proceso',
            },
          });
        }
      } catch (err) {
        this.logger.error('Webhook MP error', err);
      }
    }

    return { ok: true };
  }
}
