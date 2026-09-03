import { api } from './api';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SuperAdmin' | 'Admin' | 'Vendedor' | 'Logistica' | 'Contabilidad';
  companyId: string;
  companyStatus: string;
}

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 días en segundos

function setCookie(name: string, value: string, maxAge = COOKIE_MAX_AGE) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearCookies() {
  document.cookie = 'accessToken=; path=/; max-age=0';
  document.cookie = 'userRole=; path=/; max-age=0';
}

// Guarda la sesión en localStorage (para el cliente Axios) Y en cookie (para el
// middleware). La usan tanto login() como el demo-login, para que ambos caminos
// dejen al usuario en el mismo estado autenticado.
export function persistSession(data: { accessToken: string; refreshToken: string; user: AuthUser }) {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));
  setCookie('accessToken', data.accessToken);
  setCookie('userRole', data.user.role);
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post('/auth/login', { email, password });
  persistSession(data);
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
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  clearCookies();
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
