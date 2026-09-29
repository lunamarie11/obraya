import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';

// Ver ADR-013: reporte de errores no controlados via Sentry. Mismo patron
// best-effort que AfipService/EmailService/NotificationsService: si falta
// SENTRY_DSN el servicio queda deshabilitado y captureException() no hace
// nada, nunca bloquea ni hace fallar al resto de la app.
@Injectable()
export class ErrorTrackingService implements OnModuleInit {
  private readonly logger = new Logger(ErrorTrackingService.name);
  private enabled = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const dsn = this.config.get<string>('SENTRY_DSN');
    if (!dsn) {
      this.logger.warn('Sentry deshabilitado: falta SENTRY_DSN. Los errores solo quedan en los logs de Winston.');
      return;
    }

    const environment = this.config.get<string>('SENTRY_ENVIRONMENT') || process.env.NODE_ENV || 'development';
    const tracesSampleRate = parseFloat(this.config.get<string>('SENTRY_TRACES_SAMPLE_RATE') ?? '0');

    Sentry.init({ dsn, environment, tracesSampleRate });
    this.enabled = true;
    this.logger.log(`Sentry inicializado (environment: ${environment})`);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  captureException(error: unknown, context?: Record<string, unknown>): void {
    if (!this.enabled) return;
    Sentry.captureException(error, context ? { extra: context } : undefined);
  }
}
