import { Injectable, ValidationPipe, ArgumentMetadata } from '@nestjs/common';
import { InputSanitizerService } from './input-sanitizer.service';

@Injectable()
export class SecureValidationPipe extends ValidationPipe {
  constructor(private readonly sanitizer: InputSanitizerService) {
    super({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
      validationError: { target: false, value: false },
      errorHttpStatusCode: 400,
    });
  }

  async transform(value: any, metadata: ArgumentMetadata) {
    const sanitizedValue = this.sanitizer.sanitizeObject(value);
    return super.transform(sanitizedValue, metadata);
  }
}