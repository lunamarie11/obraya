import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MercadoPagoConfig, { Payment, Preference } from 'mercadopago';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly client: MercadoPagoConfig;

  constructor(private config: ConfigService) {
    this.client = new MercadoPagoConfig({
      accessToken: this.config.get<string>('MP_ACCESS_TOKEN') ?? 'TEST-token',
      options: { timeout: 5000 },
    });
  }

  async createPreference(order: {
    id: string;
    orderNumber: string;
    items: Array<{ name: string; qty: number; price: number }>;
    total: number;
    payerEmail: string;
  }): Promise<{ preferenceId: string; initPoint: string; sandboxInitPoint: string }> {
    const preference = new Preference(this.client);

    const body = {
      external_reference: order.id,
      items: order.items.map((i) => ({
        id: i.name.toLowerCase().replace(/\s+/g, '-'),
        title: i.name,
        quantity: i.qty,
        unit_price: i.price,
        currency_id: 'ARS',
      })),
      payer: { email: order.payerEmail },
      back_urls: {
        success: `${this.config.get('FRONTEND_URL')}/buyer/orders?payment=success&order=${order.id}`,
        failure: `${this.config.get('FRONTEND_URL')}/buyer/orders?payment=failure&order=${order.id}`,
        pending: `${this.config.get('FRONTEND_URL')}/buyer/orders?payment=pending&order=${order.id}`,
      },
      auto_return: 'approved' as const,
      notification_url: `${this.config.get('BACKEND_URL', 'http://localhost:3003')}/api/v1/payments/webhook`,
      statement_descriptor: 'ObraYa',
      metadata: { orderNumber: order.orderNumber },
    };

    const result = await preference.create({ body });

    return {
      preferenceId: result.id!,
      initPoint: result.init_point!,
      sandboxInitPoint: result.sandbox_init_point!,
    };
  }

  async getPaymentInfo(paymentId: string) {
    const payment = new Payment(this.client);
    return payment.get({ id: paymentId });
  }
}
