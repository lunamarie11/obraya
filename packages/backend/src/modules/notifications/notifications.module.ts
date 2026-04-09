import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// MVP: Email + push via Firebase FCM. Nuevo pedido, stock critico, pedido cancelado

@Module({
  imports: [
    // TypeOrmModule.forFeature([Notification, NotificationTemplate, NotificationPreference]),
  ],
  controllers: [
    // NotificationController,
  ],
  providers: [
    // NotificationService,
    // EmailService,
    // FirebaseService (FCM),
  ],
  exports: [
    // NotificationService,
  ],
})
export class NotificationsModule {}
