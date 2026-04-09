import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Fase 2: MercadoPago integration, split de pagos, facturacion AFIP

@Module({
  imports: [
    // TypeOrmModule.forFeature([Payment, PaymentMethod, Invoice, PaymentSplit]),
  ],
  controllers: [
    // PaymentController,
    // WebhookController (for MercadoPago),
  ],
  providers: [
    // PaymentService,
    // MercadoPagoService,
    // AFIPService,
    // InvoiceService,
  ],
  exports: [
    // PaymentService,
  ],
})
export class PaymentsModule {}
