import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

@Injectable()
export class SecurityBridgeMiddleware implements NestMiddleware {
  private rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  private corsOptions = {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://obraya.com', 'https://app.obraya.com']
      : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };

  use(req: Request, res: Response, next: NextFunction) {
    // Apply Helmet for security headers
    helmet()(req, res, () => {});

    // Apply CORS
    cors(this.corsOptions)(req, res, () => {});

    // Apply rate limiting
    this.rateLimiter(req, res, () => {});

    // Security headers adicionales
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    // Log suspicious activity
    this.detectMaliciousActivity(req);

    next();
  }

  private detectMaliciousActivity(req: Request) {
    const suspiciousPatterns = [
      /\.\./,  // Directory traversal
      /<script/i,  // XSS attempts
      /union.*select/i,  // SQL injection
      /eval\(/i,  // Code injection
      /base64/i,  // Encoded payloads
    ];

    const requestData = JSON.stringify({
      url: req.url,
      body: req.body,
      query: req.query,
      headers: req.headers,
    });

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData));

    if (isSuspicious) {
      console.warn(`🚨 Actividad sospechosa detectada:`, {
        ip: req.ip,
        url: req.url,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
      });
    }
  }
}