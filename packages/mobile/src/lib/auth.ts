import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

// Espejo de packages/frontend/src/lib/auth.ts (mismo AuthUser, mismos endpoints).
// No hay cookies acá (eran solo para el middleware de Next.js, no aplica en RN).
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SuperAdmin' | 'Admin' | 'Vendedor' | 'Logistica' | 'Contabilidad';
  companyId: string;
  companyStatus: string;
}

export async function persistSession(data: { accessToken: string; refreshToken: string; user: AuthUser }) {
  await AsyncStorage.multiSet([
    ['accessToken', data.accessToken],
    ['refreshToken', data.refreshToken],
    ['user', JSON.stringify(data.user)],
  ]);
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post('/auth/login', { email, password });
  await persistSession(data);
  return data.user;
}

export async function demoLogin(email: string): Promise<AuthUser> {
  const { data } = await api.post('/auth/demo', { email });
  await persistSession(data);
  return data.user;
}

export async function logout() {
  await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export async function isAuthenticated(): Promise<boolean> {
  return !!(await AsyncStorage.getItem('accessToken'));
}
