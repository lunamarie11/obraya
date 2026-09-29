import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ErrorTrackingService } from '../error-tracking.service';

const mockInit = jest.fn();
const mockCaptureException = jest.fn();

jest.mock('@sentry/node', () => ({
  init: (...args: unknown[]) => mockInit(...args),
  captureException: (...args: unknown[]) => mockCaptureException(...args),
}));

async function buildService(env: Record<string, string | undefined>): Promise<ErrorTrackingService> {
  const mockConfig = { get: (key: string) => env[key] };
  const module: TestingModule = await Test.createTestingModule({
    providers: [ErrorTrackingService, { provide: ConfigService, useValue: mockConfig }],
  }).compile();

  const service = module.get<ErrorTrackingService>(ErrorTrackingService);
  service.onModuleInit();
  return service;
}

describe('ErrorTrackingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('se deshabilita si falta SENTRY_DSN', async () => {
    const service = await buildService({});
    expect(service.isEnabled()).toBe(false);
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('se habilita e inicializa Sentry si hay SENTRY_DSN', async () => {
    const service = await buildService({ SENTRY_DSN: 'https://example@sentry.io/1', SENTRY_ENVIRONMENT: 'testing' });
    expect(service.isEnabled()).toBe(true);
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: 'https://example@sentry.io/1', environment: 'testing' }),
    );
  });

  it('captureException no hace nada si esta deshabilitado', async () => {
    const service = await buildService({});
    service.captureException(new Error('boom'));
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('captureException reporta a Sentry con contexto si esta habilitado', async () => {
    const service = await buildService({ SENTRY_DSN: 'https://example@sentry.io/1' });
    const error = new Error('boom');
    service.captureException(error, { url: '/api/v1/orders' });
    expect(mockCaptureException).toHaveBeenCalledWith(error, { extra: { url: '/api/v1/orders' } });
  });
});
