import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

// Ver ADR-007. Puertos de dev de este monorepo: frontend 3002, backend 3010.
export const CorsConfig = (): CorsOptions => {
  const allowedOrigins = [
    'http://localhost:3002',
    'http://127.0.0.1:3002',
  ];

  if (process.env.NODE_ENV === 'production') {
    allowedOrigins.push('https://app.obraya.com');
    allowedOrigins.push('https://admin.obraya.com');
  }

  if (process.env.ALLOWED_ORIGINS) {
    allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()));
  }

  return {
    origin: (origin, callback) => {
      // Sin origin (apps mobile, curl, Postman) o en dev: permitir
      if (!origin || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS not allowed for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 3600,
  };
};
