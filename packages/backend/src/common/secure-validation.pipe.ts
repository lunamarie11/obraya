import { Injectable, ValidationPipe, ArgumentMetadata } from '@nestjs/common';
import { InputSanitizerService } from './input-sanitizer.service';

// Reemplaza el ValidationPipe global: sanitiza contra XSS/inyeccion antes de
// validar con class-validator. Ver ADR-007.
@Injectable()
export class SecureValidationPipe extends ValidationPipe {
  constructor(private readonly sanitizer: InputSanitizerService) {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    });
  }

  async transform(value: any, metadata: ArgumentMetadata) {
    const sanitizedValue = this.sanitizer.sanitizeObject(value);
    return super.transform(sanitizedValue, metadata);
  }
}
