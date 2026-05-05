import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private initialized = false;

  constructor(private config: ConfigService) {}

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
      this.logger.error('Error inicializando Firebase Admin', err);
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
    } catch (err: any) {
      // Token inválido o expirado — no interrumpir el flujo principal
      this.logger.warn(`FCM send failed for token ${token.slice(0, 10)}…: ${err.message}`);
    }
  }

  async notifyOrderStatus(
    fcmToken: string | null | undefined,
    orderNumber: string,
    status: string,
  ): Promise<void> {
    if (!fcmToken) return;

    const messages: Record<string, { title: string; body: string }> = {
      CONFIRMED:  { title: '✅ Pedido confirmado', body: `Tu pedido ${orderNumber} fue confirmado y está en preparación.` },
      PREPARING:  { title: '📦 Preparando tu pedido', body: `${orderNumber} está siendo preparado en el depósito.` },
      IN_TRANSIT: { title: '🚚 Tu pedido está en camino', body: `${orderNumber} salió hacia tu dirección.` },
      DELIVERED:  { title: '🎉 Pedido entregado', body: `${orderNumber} fue entregado. ¡Gracias por comprar en ObraYa!` },
      CANCELLED:  { title: '❌ Pedido cancelado', body: `Tu pedido ${orderNumber} fue cancelado.` },
    };

    const msg = messages[status];
    if (msg) {
      await this.sendToToken(fcmToken, msg.title, msg.body, { orderId: orderNumber, status });
    }
  }
}
