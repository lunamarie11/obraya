import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

// Ver ADR-011: email transaccional via AWS SES (invitaciones de usuario,
// notificaciones de cambio de estado de pedido).
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
