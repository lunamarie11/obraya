import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InputSanitizerService } from './input-sanitizer.service';

@Injectable()
export class SanitizeMiddleware implements NestMiddleware {
  constructor(private readonly sanitizer: InputSanitizerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (req.body && typeof req.body === 'object') {
      Object.assign(req.body, this.sanitizer.sanitizeObject(req.body));
    }
    if (req.query && typeof req.query === 'object') {
      Object.assign(req.query, this.sanitizer.sanitizeObject(req.query));
    }
    if (req.params && typeof req.params === 'object') {
      Object.assign(req.params, this.sanitizer.sanitizeObject(req.params));
    }
    next();
  }
}
