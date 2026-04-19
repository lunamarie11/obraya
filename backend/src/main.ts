import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggerService } from './common/logging/logger.service';
import { MetricsService } from './common/monitoring/metrics.service';
import { CorsConfig } from './config/cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get logger and metrics services for global interceptor
  const loggerService = app.get(LoggerService);
  const metricsService = app.get(MetricsService);
  
  app.setGlobalPrefix('api');
  
  // Add global logging interceptor with metrics
  app.useGlobalInterceptors(new LoggingInterceptor(loggerService, metricsService));
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Enable CORS with dynamic configuration
  app.enableCors(CorsConfig());

  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  console.log(`🚀 ObraYa API running on: http://localhost:${port}/api`);
  loggerService.log(`Server started on port ${port}`, 'Bootstrap');
}
bootstrap();
