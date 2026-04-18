import { Injectable, ValidationPipe, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { InputSanitizerService } from './input-sanitizer.service';

@Injectable()
export class SecureValidationPipe extends ValidationPipe {
  constructor(private readonly sanitizer: InputSanitizerService) {
    super({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    });
  }

  async transform(value: any, metadata: ArgumentMetadata) {
    // Sanitizar primero
    const sanitizedValue = this.sanitizer.sanitizeObject(value);

    // Luego validar
    return super.transform(sanitizedValue, metadata);
  }
}