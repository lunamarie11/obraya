import { api } from './api';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Vendedor' | 'Logistica' | 'Contabilidad';
  companyId: string;
  companyStatus: string;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post('/auth/login', { email, password });
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
}

export async function register(payload: {
  cuit: string;
  razonSocial: string;
  email: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminPassword: string;
  city?: string;
  province?: string;
}) {
  const { data } = await api.post('/auth/register', payload);
  return data;
}

export function logout() {
  localStorage.clear();
  window.location.href = '/login';
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('accessToken');
}
