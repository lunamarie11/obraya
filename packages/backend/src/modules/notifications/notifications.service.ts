import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { OrderStatus } from '../orders/entities/order.entity';

// Ver ADR-007: push notifications al comprador via Firebase Cloud Messaging.
// Best-effort: un token FCM inválido o Firebase no configurado nunca debe
// interrumpir el flujo principal (creación/actualización de pedidos).
@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private initialized = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const serviceAccountJson = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT');
    if (!serviceAccountJson) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT no configurado — push notifications deshabilitadas');
      return;
    }
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      }
      this.initialized = true;
      this.logger.log('Firebase Admin inicializado');
    } catch (err) {
      this.logger.error('Error inicializando Firebase Admin', err as Error);
    }
  }

  async sendToToken(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.initialized || !token) return;
    try {
      await admin.messaging().send({ token, notification: { title, body }, data });
    } catch (err) {
      // Token inválido o expirado — no interrumpir el flujo principal
      this.logger.warn(`FCM send failed for token ${token.slice(0, 10)}…: ${(err as Error).message}`);
    }
  }

  async notifyOrderStatus(
    fcmToken: string | null | undefined,
    orderNumber: string,
    status: OrderStatus,
  ): Promise<void> {
    if (!fcmToken) return;

    const messages: Partial<Record<OrderStatus, { title: string; body: string }>> = {
      [OrderStatus.ACEPTADO]:    { title: 'Pedido aceptado', body: `Tu pedido ${orderNumber} fue aceptado y pasa a preparación.` },
      [OrderStatus.PREPARACION]: { title: 'Preparando tu pedido', body: `${orderNumber} está siendo preparado.` },
      [OrderStatus.DESPACHADO]:  { title: 'Tu pedido está en camino', body: `${orderNumber} fue despachado.` },
      [OrderStatus.ENTREGADO]:   { title: 'Pedido entregado', body: `${orderNumber} fue entregado. ¡Gracias por comprar en ObraYa!` },
      [OrderStatus.CANCELADO]:   { title: 'Pedido cancelado', body: `Tu pedido ${orderNumber} fue cancelado.` },
    };

    const msg = messages[status];
    if (msg) {
      await this.sendToToken(fcmToken, msg.title, msg.body, { orderNumber, status });
    }
  }
}
