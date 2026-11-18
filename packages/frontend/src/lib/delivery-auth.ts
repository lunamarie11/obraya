import { api } from './api';

export enum VehicleType {
  MOTO = 'Moto',
  AUTO = 'Auto',
  CAMIONETA = 'Camioneta',
  BICICLETA = 'Bicicleta',
  A_PIE = 'APie',
}

export interface DeliveryUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  vehicleType?: VehicleType;
  licensePlate?: string;
}

// Sesión del repartidor independiente (ver ADR-026). Usa claves de localStorage
// separadas de las de lib/auth.ts y lib/buyer-auth.ts para que un mismo navegador
// pueda tener abierta a la vez una sesión de CompanyUser, Buyer y Delivery.
export function persistDeliverySession(data: { accessToken: string; refreshToken: string; delivery: DeliveryUser }) {
  localStorage.setItem('deliveryAccessToken', data.accessToken);
  localStorage.setItem('deliveryRefreshToken', data.refreshToken);
  localStorage.setItem('deliveryUser', JSON.stringify(data.delivery));
}

function normalizeAuthResponse(data: any): { accessToken: string; refreshToken: string; delivery: DeliveryUser } {
  return { accessToken: data.accessToken, refreshToken: data.refreshToken, delivery: data.delivery ?? data.user };
}

export async function deliveryLogin(email: string, password: string): Promise<DeliveryUser> {
  const { data } = await api.post('/delivery-auth/login', { email, password });
  const session = normalizeAuthResponse(data);
  persistDeliverySession(session);
  return session.delivery;
}

export async function deliveryRegister(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  vehicleType: VehicleType;
  licensePlate?: string;
}): Promise<DeliveryUser> {
  const { data } = await api.post('/delivery-auth/register', payload);
  const session = normalizeAuthResponse(data);
  persistDeliverySession(session);
  return session.delivery;
}

export function deliveryLogout() {
  localStorage.removeItem('deliveryAccessToken');
  localStorage.removeItem('deliveryRefreshToken');
  localStorage.removeItem('deliveryUser');
  window.dispatchEvent(new CustomEvent('delivery:update'));
}

export function getStoredDelivery(): DeliveryUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('deliveryUser');
  return raw ? JSON.parse(raw) : null;
}

export function isDeliveryAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('deliveryAccessToken');
}
