import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

// Ver ADR-007: push notifications al comprador via Firebase Cloud Messaging.
@Module({
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
