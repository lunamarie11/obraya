import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MercadoPagoConfig, { Payment, Preference } from 'mercadopago';

// Ver ADR-007: pagos reales con Mercado Pago (Checkout Pro).
// El pedido se crea en estado Nuevo igual con cualquier método de pago;
// el webhook solo actualiza paymentStatus/mpPaymentId, no fuerza transiciones
// del estado del pedido (eso lo sigue decidiendo el fabricante).
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly client: MercadoPagoConfig;

  constructor(private readonly config: ConfigService) {
    this.client = new MercadoPagoConfig({
      accessToken: this.config.get<string>('MERCADOPAGO_ACCESS_TOKEN') ?? 'TEST-token',
      options: { timeout: 5000 },
    });
  }

  async createPreference(order: {
    id: string;
    orderNumber: string;
    items: Array<{ name: string; qty: number; price: number }>;
    payerEmail: string;
  }): Promise<{ preferenceId: string; initPoint: string }> {
    const preference = new Preference(this.client);
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3002';
    const backendUrl = this.config.get<string>('BACKEND_URL') ?? 'http://localhost:3000';

    const body = {
      external_reference: order.id,
      items: order.items.map((i) => ({
        id: i.name.toLowerCase().replace(/\s+/g, '-'),
        title: i.name,
        quantity: i.qty,
        // MP espera el precio en la unidad monetaria (ARS), no en centavos.
        unit_price: i.price / 100,
        currency_id: 'ARS',
      })),
      payer: { email: order.payerEmail },
      back_urls: {
        success: `${frontendUrl}/my-orders?payment=success&order=${order.id}`,
        failure: `${frontendUrl}/my-orders?payment=failure&order=${order.id}`,
        pending: `${frontendUrl}/my-orders?payment=pending&order=${order.id}`,
      },
      auto_return: 'approved' as const,
      notification_url: `${backendUrl}/api/v1/payments/webhook`,
      statement_descriptor: 'ObraYa',
      metadata: { orderNumber: order.orderNumber },
    };

    const result = await preference.create({ body });
    this.logger.log(`Preferencia MP creada para pedido ${order.orderNumber}: ${result.id}`);

    return {
      preferenceId: result.id!,
      initPoint: result.init_point!,
    };
  }

  async getPaymentInfo(paymentId: string) {
    const payment = new Payment(this.client);
    return payment.get({ id: paymentId });
  }
}
