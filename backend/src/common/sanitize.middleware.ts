import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InputSanitizerService } from './input-sanitizer.service';

@Injectable()
export class SanitizeMiddleware implements NestMiddleware {
  constructor(private readonly sanitizer: InputSanitizerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Sanitizar body
    if (req.body && typeof req.body === 'object') {
      const sanitizedBody = this.sanitizer.sanitizeObject(req.body);
      Object.assign(req.body, sanitizedBody);
    }

    // Sanitizar query params
    if (req.query && typeof req.query === 'object') {
      const sanitizedQuery = this.sanitizer.sanitizeObject(req.query);
      Object.assign(req.query, sanitizedQuery);
    }

    // Sanitizar params
    if (req.params && typeof req.params === 'object') {
      const sanitizedParams = this.sanitizer.sanitizeObject(req.params);
      Object.assign(req.params, sanitizedParams);
    }

    next();
  }
}