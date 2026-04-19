import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Optional,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { LoggerService } from '../logging/logger.service';
import { MetricsService } from '../monitoring/metrics.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private logger: LoggerService,
    @Optional() private metricsService?: MetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, headers, body } = request;
    const userAgent = headers['user-agent'];
    const ip = headers['x-forwarded-for'] || request.connection.remoteAddress;
    const requestId = headers['x-request-id'] || this.generateRequestId();

    request.id = requestId;
    const startTime = Date.now();

    this.logger.log(`Incoming ${method} ${url}`, 'HTTP', {
      requestId,
      ip,
      userAgent,
      body: body ? Object.keys(body) : null,
    });

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        this.logger.log(`${method} ${url} completed`, 'HTTP', {
          requestId,
          statusCode,
          duration: `${duration}ms`,
        });

        // Record metrics if service available
        if (this.metricsService) {
          this.metricsService.recordRequest(method, url, statusCode, duration);
        }

        return data;
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        this.logger.error(
          `${method} ${url} failed`,
          error.stack,
          'HTTP',
          {
            requestId,
            duration: `${duration}ms`,
            error: error.message,
            status: statusCode,
          }
        );

        // Record metrics if service available
        if (this.metricsService) {
          this.metricsService.recordRequest(method, url, statusCode, duration, true);
        }

        throw error;
      })
    );
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
