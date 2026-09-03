import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

// Espejo de packages/frontend/src/lib/buyer-auth.ts (ver ADR-006), adaptado a
// AsyncStorage (async) siguiendo el mismo patrón que lib/auth.ts. Usa claves
// de storage separadas ('buyerAccessToken', 'buyerRefreshToken', 'buyerUser')
// de las de lib/auth.ts para que, en teoría, convivan una sesión de Buyer
// (marketplace) y una de CompanyUser sin pisarse — en la práctica mobile solo
// usa la de Buyer, pero se mantiene el mismo esquema que la web por paridad.
export interface BuyerUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export async function persistBuyerSession(data: { accessToken: string; refreshToken: string; buyer: BuyerUser }) {
  await AsyncStorage.multiSet([
    ['buyerAccessToken', data.accessToken],
    ['buyerRefreshToken', data.refreshToken],
    ['buyerUser', JSON.stringify(data.buyer)],
  ]);
}

function normalizeAuthResponse(data: any): { accessToken: string; refreshToken: string; buyer: BuyerUser } {
  return { accessToken: data.accessToken, refreshToken: data.refreshToken, buyer: data.buyer ?? data.user };
}

export async function buyerLogin(email: string, password: string): Promise<BuyerUser> {
  const { data } = await api.post('/buyer-auth/login', { email, password });
  const session = normalizeAuthResponse(data);
  await persistBuyerSession(session);
  return session.buyer;
}

export async function buyerRegister(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<BuyerUser> {
  const { data } = await api.post('/buyer-auth/register', payload);
  const session = normalizeAuthResponse(data);
  await persistBuyerSession(session);
  return session.buyer;
}

export async function buyerDemoLogin(email: string): Promise<BuyerUser> {
  const { data } = await api.post('/buyer-auth/demo', { email });
  const session = normalizeAuthResponse(data);
  await persistBuyerSession(session);
  return session.buyer;
}

export async function buyerLogout() {
  await AsyncStorage.multiRemove(['buyerAccessToken', 'buyerRefreshToken', 'buyerUser']);
}

export async function getStoredBuyer(): Promise<BuyerUser | null> {
  const raw = await AsyncStorage.getItem('buyerUser');
  return raw ? JSON.parse(raw) : null;
}

export async function isBuyerAuthenticated(): Promise<boolean> {
  return !!(await AsyncStorage.getItem('buyerAccessToken'));
}
