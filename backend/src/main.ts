import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggerService } from './common/logging/logger.service';
import { MetricsService } from './common/monitoring/metrics.service';
import { InputSanitizerService } from './common/input-sanitizer.service';
import { SecureValidationPipe } from './common/secure-validation.pipe';
import { CorsConfig } from './config/cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get logger, metrics and sanitizer services for global interceptor/pipe
  const loggerService = app.get(LoggerService);
  const metricsService = app.get(MetricsService);
  const sanitizer = app.get(InputSanitizerService);
  
  app.setGlobalPrefix('api');
  
  // Add global logging interceptor with metrics
  app.useGlobalInterceptors(new LoggingInterceptor(loggerService, metricsService));
  
  app.useGlobalPipes(new SecureValidationPipe(sanitizer));

  // Enable CORS with dynamic configuration
  app.enableCors(CorsConfig());

  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  console.log(`🚀 ObraYa API running on: http://localhost:${port}/api`);
  loggerService.log(`Server started on port ${port}`, 'Bootstrap');
}
bootstrap();
