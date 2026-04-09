import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global de API
  app.setGlobalPrefix('api/v1');

  // Validación automática con class-validator en todos los endpoints
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // Elimina campos no declarados en el DTO
      forbidNonWhitelisted: true,
      transform: true,       // Transforma tipos automáticamente
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS para frontend local en dev
  if (process.env.NODE_ENV === 'development') {
    app.enableCors({ origin: ['http://localhost:3001', 'http://localhost:3000'] });
  }

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
