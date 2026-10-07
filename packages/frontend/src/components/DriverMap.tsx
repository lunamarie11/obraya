'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface DriverMapPoint {
  companyUserId: string;
  firstName: string;
  lastName: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  recordedAt: string;
  orderId: string;
  orderNumber: string;
}

// Icono custom (divIcon con un emoji) en vez del marker default de Leaflet:
// evita el problema conocido de los PNGs default de Leaflet rotos bajo
// webpack/Next.js sin tener que manipular imports de imágenes.
const truckIcon = L.divIcon({
  html: '<div style="font-size: 22px; line-height: 1;">🚚</div>',
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Centro por defecto si todavía no hay ningún repartidor activo: CABA.
const DEFAULT_CENTER: [number, number] = [-34.6037, -58.3816];

export function DriverMap({ points }: { points: DriverMapPoint[] }) {
  const center: [number, number] = points.length ? [points[0].lat, points[0].lng] : DEFAULT_CENTER;

  return (
    <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) => (
        <Marker key={p.companyUserId} position={[p.lat, p.lng]} icon={truckIcon}>
          <Popup>
            <strong>{p.firstName} {p.lastName}</strong><br />
            Pedido {p.orderNumber}<br />
            {p.accuracy != null && <>Precisión: ~{Math.round(p.accuracy)}m<br /></>}
            Actualizado: {new Date(p.recordedAt).toLocaleTimeString('es-AR')}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
