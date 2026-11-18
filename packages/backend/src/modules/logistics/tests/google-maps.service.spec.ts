import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GoogleMapsService } from '../google-maps.service';

function makeConfigService(apiKey: string | undefined): ConfigService {
  return { get: jest.fn().mockReturnValue(apiKey) } as unknown as ConfigService;
}

async function buildService(apiKey: string | undefined): Promise<GoogleMapsService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      GoogleMapsService,
      { provide: ConfigService, useValue: makeConfigService(apiKey) },
    ],
  }).compile();
  return module.get(GoogleMapsService);
}

describe('GoogleMapsService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe('sin GOOGLE_MAPS_SERVER_API_KEY configurada', () => {
    it('isEnabled() devuelve false y calculateRoute() devuelve null sin llamar a fetch', async () => {
      global.fetch = jest.fn() as any;
      const service = await buildService(undefined);

      expect(service.isEnabled()).toBe(false);
      const result = await service.calculateRoute('Origen 1', 'Destino 1');

      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('con GOOGLE_MAPS_SERVER_API_KEY configurada', () => {
    it('Directions API responde OK: devuelve polyline/distancia/duracion parseados', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({
          status: 'OK',
          routes: [
            {
              overview_polyline: { points: 'abc123' },
              legs: [{ distance: { value: 5000 }, duration: { value: 600 } }],
            },
          ],
        }),
      }) as any;
      const service = await buildService('fake-key');

      expect(service.isEnabled()).toBe(true);
      const result = await service.calculateRoute('Origen 1', 'Destino 1');

      expect(result).toEqual({ polyline: 'abc123', distanceMeters: 5000, durationSeconds: 600 });
    });

    it('Directions API devuelve status distinto de OK: devuelve null', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ status: 'ZERO_RESULTS', routes: [] }),
      }) as any;
      const service = await buildService('fake-key');

      const result = await service.calculateRoute('Origen 1', 'Destino 1');

      expect(result).toBeNull();
    });

    it('fetch lanza error de red: devuelve null sin propagar la excepcion', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('network error')) as any;
      const service = await buildService('fake-key');

      const result = await service.calculateRoute('Origen 1', 'Destino 1');

      expect(result).toBeNull();
    });
  });
});
