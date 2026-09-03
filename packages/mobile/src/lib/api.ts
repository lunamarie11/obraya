import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Espejo de packages/frontend/src/lib/api.ts, adaptado a AsyncStorage (no existe
// localStorage en React Native). Mismo comportamiento de refresh-on-401.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3010/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Rutas del comprador de marketplace (ver ADR-006): usan un JWT propio (Buyer),
// separado del JWT de CompanyUser que usa el resto de la API (backoffice).
function isBuyerRoute(url?: string) {
  return !!url && (url.includes('/buyer-auth') || url.includes('/buyer-orders') || url.includes('/buyer-addresses'));
}

api.interceptors.request.use(async (config) => {
  const token = isBuyerRoute(config.url)
    ? await AsyncStorage.getItem('buyerAccessToken')
    : await AsyncStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const buyerRoute = isBuyerRoute(original?.url);
    const isAuthEndpoint = original?.url?.includes('/auth/');
    if (error.response?.status === 401 && !original?._retry && !isAuthEndpoint) {
      original._retry = true;

      if (buyerRoute) {
        const buyerRefreshToken = await AsyncStorage.getItem('buyerRefreshToken');
        if (!buyerRefreshToken) {
          await AsyncStorage.multiRemove(['buyerAccessToken', 'buyerRefreshToken', 'buyerUser']);
          return Promise.reject(error);
        }
        try {
          const { data } = await axios.post(`${BASE_URL}/buyer-auth/refresh`, { refreshToken: buyerRefreshToken });
          await AsyncStorage.setItem('buyerAccessToken', data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          await AsyncStorage.multiRemove(['buyerAccessToken', 'buyerRefreshToken', 'buyerUser']);
          return Promise.reject(error);
        }
      }

      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await AsyncStorage.setItem('accessToken', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

export const formatARS = (centavos: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(centavos / 100);
