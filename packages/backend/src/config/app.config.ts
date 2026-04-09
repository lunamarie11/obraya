import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
}));

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  name: process.env.DATABASE_NAME || 'obraya',
  user: process.env.DATABASE_USER || 'user',
  password: process.env.DATABASE_PASSWORD || 'password',
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'change-me-in-production',
  expiration: process.env.JWT_EXPIRATION || '7d',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-refresh-in-production',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '30d',
}));

export const storageConfig = registerAs('storage', () => ({
  endpoint: process.env.STORAGE_ENDPOINT || 'localhost',
  port: parseInt(process.env.STORAGE_PORT || '9000', 10),
  useSsl: process.env.STORAGE_USE_SSL === 'true',
  accessKey: process.env.STORAGE_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.STORAGE_SECRET_KEY || 'minioadmin',
  bucket: process.env.STORAGE_BUCKET || 'obraya-dev',
}));
