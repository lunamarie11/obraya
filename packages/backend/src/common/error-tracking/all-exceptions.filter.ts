import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logging/logger.service';
import { ErrorTrackingService } from './error-tracking.service';

// Filtro global de excepciones (ver ADR-013). Reemplaza el manejo de errores
// por defecto de Nest solo para agregar logging estructurado (Winston) y
// reporte a Sentry — la respuesta HTTP que ve el cliente es la misma que
// generaria Nest por default (mismo status/body para HttpException, 500
// generico para errores no controlados).
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    private readonly errorTracking: ErrorTrackingService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttpException
      ? exception.getResponse()
      : { statusCode: status, message: 'Internal server error' };

    const message = exception instanceof Error ? exception.message : String(exception);
    const stack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error(message, stack, 'AllExceptionsFilter', {
      method: request.method,
      url: request.url,
      statusCode: status,
    });

    // Solo se reportan a Sentry los errores no controlados (5xx) o excepciones
    // que no son HttpException — un 404/400 de negocio no es un incidente.
    if (!isHttpException || status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.errorTracking.captureException(exception, {
        method: request.method,
        url: request.url,
        statusCode: status,
      });
    }

    response.status(status).json(typeof body === 'string' ? { statusCode: status, message: body } : body);
  }
}
