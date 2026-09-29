import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SecureValidationPipe } from './common/secure-validation.pipe';
import { InputSanitizerService } from './common/input-sanitizer.service';
import { CorsConfig } from './config/cors.config';
import { LoggerService } from './common/logging/logger.service';
import { ErrorTrackingService } from './common/error-tracking/error-tracking.service';
import { validateProductionEnv } from './config/validate-production-env';

// Red de seguridad para errores que ni siquiera llegan al AllExceptionsFilter
// de Nest (por ejemplo: excepciones fuera del ciclo request/response, o
// promesas sin catch en timers/listeners). Se reportan a Winston/Sentry y el
// proceso se cierra: un uncaughtException deja la app en estado indefinido,
// es mas seguro reiniciar (Docker/PM2/systemd) que seguir sirviendo tráfico.
function registerProcessErrorHandlers(logger: LoggerService, errorTracking: ErrorTrackingService) {
  process.on('uncaughtException', (error: Error) => {
    logger.error(error.message, error.stack, 'uncaughtException');
    errorTracking.captureException(error, { source: 'uncaughtException' });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error(error.message, error.stack, 'unhandledRejection');
    errorTracking.captureException(error, { source: 'unhandledRejection' });
  });
}

async function bootstrap() {
  // Fail-fast (ver ADR-014): en produccion, nunca arrancar con secrets
  // adivinables o sin configurar. Corre antes de crear la app porque no hay
  // nada mas seguro que hacer con esa configuracion.
  const configErrors = validateProductionEnv();
  if (configErrors.length > 0) {
    console.error('No se puede arrancar en producción: configuración insegura detectada.');
    configErrors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  registerProcessErrorHandlers(app.get(LoggerService), app.get(ErrorTrackingService));

  // Prefijo global de API
  app.setGlobalPrefix('api/v1');

  app.use(helmet());

  // Validación con class-validator + sanitización contra XSS/inyección (ADR-007)
  app.useGlobalPipes(new SecureValidationPipe(app.get(InputSanitizerService)));

  app.enableCors(CorsConfig());

  // Swagger docs en /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('ObraYa API')
    .setDescription('API del marketplace B2B2C de materiales de construcción')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`ObraYa API corriendo en http://localhost:${port}/api/v1`);
  console.log(`Swagger docs en http://localhost:${port}/api/docs`);
}
bootstrap();
