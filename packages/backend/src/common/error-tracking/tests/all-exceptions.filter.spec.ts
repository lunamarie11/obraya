import { ArgumentsHost, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { AllExceptionsFilter } from '../all-exceptions.filter';
import { LoggerService } from '../../logging/logger.service';
import { ErrorTrackingService } from '../error-tracking.service';

function buildHost(request: Partial<Record<string, unknown>> = {}) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method: 'GET', url: '/api/v1/orders', ...request }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('AllExceptionsFilter', () => {
  let logger: jest.Mocked<LoggerService>;
  let errorTracking: jest.Mocked<ErrorTrackingService>;
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    logger = { error: jest.fn() } as unknown as jest.Mocked<LoggerService>;
    errorTracking = { captureException: jest.fn() } as unknown as jest.Mocked<ErrorTrackingService>;
    filter = new AllExceptionsFilter(logger, errorTracking);
  });

  it('respeta el status/body de una HttpException y no reporta a Sentry (error de negocio, no incidente)', () => {
    const { host, status, json } = buildHost();
    filter.catch(new BadRequestException('CUIT invalido'), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ statusCode: 400, message: 'CUIT invalido', error: 'Bad Request' });
    expect(errorTracking.captureException).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('devuelve 500 generico y reporta a Sentry para un error no controlado', () => {
    const { host, status, json } = buildHost();
    const error = new Error('DB caida');
    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ statusCode: 500, message: 'Internal server error' });
    expect(errorTracking.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({ statusCode: 500, method: 'GET', url: '/api/v1/orders' }),
    );
  });

  it('reporta a Sentry un 500 explicito (InternalServerErrorException)', () => {
    const { host } = buildHost();
    filter.catch(new InternalServerErrorException('falla interna'), host);

    expect(errorTracking.captureException).toHaveBeenCalled();
  });
});
