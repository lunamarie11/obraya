import { api } from './api';

export interface BuyerUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

// Sesión del comprador de marketplace (ver ADR-006). Usa claves de localStorage
// separadas de las de lib/auth.ts para que un mismo navegador pueda tener abierta
// a la vez una sesión de CompanyUser (backoffice) y una de Buyer (marketplace).
export function persistBuyerSession(data: { accessToken: string; refreshToken: string; buyer: BuyerUser }) {
  localStorage.setItem('buyerAccessToken', data.accessToken);
  localStorage.setItem('buyerRefreshToken', data.refreshToken);
  localStorage.setItem('buyerUser', JSON.stringify(data.buyer));
}

function normalizeAuthResponse(data: any): { accessToken: string; refreshToken: string; buyer: BuyerUser } {
  return { accessToken: data.accessToken, refreshToken: data.refreshToken, buyer: data.buyer ?? data.user };
}

export async function buyerLogin(email: string, password: string): Promise<BuyerUser> {
  const { data } = await api.post('/buyer-auth/login', { email, password });
  const session = normalizeAuthResponse(data);
  persistBuyerSession(session);
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
  persistBuyerSession(session);
  return session.buyer;
}

export async function buyerDemoLogin(email: string): Promise<BuyerUser> {
  const payload: any = { email };
  if (process.env.NEXT_PUBLIC_DEMO_SECRET) payload.demoSecret = process.env.NEXT_PUBLIC_DEMO_SECRET;
  const { data } = await api.post('/buyer-auth/demo', payload);
  const session = normalizeAuthResponse(data);
  persistBuyerSession(session);
  return session.buyer;
}

export function buyerLogout() {
  localStorage.removeItem('buyerAccessToken');
  localStorage.removeItem('buyerRefreshToken');
  localStorage.removeItem('buyerUser');
  window.dispatchEvent(new CustomEvent('buyer:update'));
}

export function getStoredBuyer(): BuyerUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('buyerUser');
  return raw ? JSON.parse(raw) : null;
}

export function isBuyerAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('buyerAccessToken');
}
