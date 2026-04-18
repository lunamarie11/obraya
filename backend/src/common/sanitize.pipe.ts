import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { InputSanitizerService } from './input-sanitizer.service';

@Injectable()
export class SanitizePipe implements PipeTransform {
  constructor(private readonly sanitizer: InputSanitizerService) {}

  transform(value: any) {
    if (typeof value === 'string') {
      return this.sanitizer.sanitize(value);
    }

    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value);
    }

    return value;
  }

  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.transform(item));
    }

    const sanitized = { ...obj };
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = this.sanitizer.sanitize(sanitized[key]);
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeObject(sanitized[key]);
      }
    }
    return sanitized;
  }
}