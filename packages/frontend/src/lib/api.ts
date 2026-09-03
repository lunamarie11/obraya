import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3010/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Rutas del comprador de marketplace (ver ADR-006): usan un JWT propio (Buyer),
// separado del JWT de CompanyUser que usa el resto de la API (backoffice).
function isBuyerRoute(url?: string) {
  return (
    !!url &&
    (url.includes('/buyer-auth') ||
      url.includes('/buyer-orders') ||
      url.includes('/buyer-addresses') ||
      url.includes('/buyer-favorites'))
  );
}

// Inyectar token en cada request, eligiendo el par de tokens según la ruta
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = isBuyerRoute(config.url)
      ? localStorage.getItem('buyerAccessToken')
      : localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh cuando expira el token
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const buyerRoute = isBuyerRoute(original?.url);
    // No interceptar errores de los propios endpoints de auth
    const isAuthEndpoint = original?.url?.includes('/auth/');
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3010/api/v1';

      if (buyerRoute) {
        const buyerRefreshToken = localStorage.getItem('buyerRefreshToken');
        if (!buyerRefreshToken) return Promise.reject(error);
        try {
          const { data } = await axios.post(`${baseURL}/buyer-auth/refresh`, { refreshToken: buyerRefreshToken });
          localStorage.setItem('buyerAccessToken', data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.removeItem('buyerAccessToken');
          localStorage.removeItem('buyerRefreshToken');
          localStorage.removeItem('buyerUser');
          return Promise.reject(error);
        }
      }

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        window.location.href = '/login';
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

// Helpers tipados
export const formatARS = (centavos: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(centavos / 100);
