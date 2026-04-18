import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InputSanitizerService } from './input-sanitizer.service';

@Injectable()
export class SanitizeMiddleware implements NestMiddleware {
  constructor(private readonly sanitizer: InputSanitizerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Sanitizar body
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizer.sanitizeObject(req.body);
    }

    // Sanitizar query params
    if (req.query && typeof req.query === 'object') {
      req.query = this.sanitizer.sanitizeObject(req.query);
    }

    // Sanitizar params
    if (req.params && typeof req.params === 'object') {
      req.params = this.sanitizer.sanitizeObject(req.params);
    }

    next();
  }
}