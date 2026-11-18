import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GoogleMapsRoute {
  polyline: string;
  distanceMeters: number;
  durationSeconds: number;
}

// Ver ADR-027 / docs/specs/fase4e-tracking-google-maps.md: wrapper sobre la
// Directions API de Google, mismo patron best-effort que AfipService y
// PaymentsService -- si no hay API key configurada, el servicio queda
// deshabilitado y calculateRoute devuelve null sin bloquear el despacho del
// pedido. Origen y destino se pasan como texto libre (direccion de la
// empresa + deliveryAddress del pedido): Directions API geocodea
// internamente como parte de la misma llamada facturable, no hace falta
// agregar Geocoding API por separado.
@Injectable()
export class GoogleMapsService {
  private readonly logger = new Logger(GoogleMapsService.name);
  private readonly apiKey?: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GOOGLE_MAPS_SERVER_API_KEY');
    this.enabled = !!this.apiKey;
    if (!this.enabled) {
      this.logger.warn(
        'GoogleMapsService deshabilitado: falta GOOGLE_MAPS_SERVER_API_KEY. El despacho de pedidos funciona igual, sin ruta calculada.',
      );
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Calcula la ruta entre dos direcciones de texto libre. Se llama UNA sola
  // vez por pedido (al pasar a Despachado, ver OrdersService), nunca en
  // cada poll de posicion -- eso multiplicaria el costo por el numero de
  // polls sin necesidad real.
  async calculateRoute(origin: string, destination: string): Promise<GoogleMapsRoute | null> {
    if (!this.enabled) return null;

    try {
      const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
      url.searchParams.set('origin', origin);
      url.searchParams.set('destination', destination);
      url.searchParams.set('key', this.apiKey as string);

      const response = await fetch(url.toString());
      const data: any = await response.json();

      if (data.status !== 'OK' || !data.routes?.length) {
        this.logger.warn(
          `Directions API no devolvio ruta (status=${data.status}) para "${origin}" -> "${destination}"`,
        );
        return null;
      }

      const route = data.routes[0];
      const leg = route.legs?.[0];
      if (!route.overview_polyline?.points || !leg) return null;

      return {
        polyline: route.overview_polyline.points,
        distanceMeters: leg.distance?.value ?? 0,
        durationSeconds: leg.duration?.value ?? 0,
      };
    } catch (err) {
      this.logger.warn(`Error llamando a Directions API: ${(err as Error).message}`);
      return null;
    }
  }
}
