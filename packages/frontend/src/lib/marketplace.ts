import { api } from '@/lib/api';
import type { PublicCompany, PublicProduct, PromotionBanner, Review, ShippingQuote } from '@obraya/shared';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getPublicCompanies(): Promise<PublicCompany[]> {
  const { data } = await api.get('/public/companies');
  return data;
}

export async function getPublicCompany(companyId: string): Promise<PublicCompany> {
  const { data } = await api.get(`/public/companies/${companyId}`);
  return data;
}

export async function getPublicCompanyProducts(
  companyId: string,
  params: { page?: number; limit?: number; search?: string; category?: string } = {},
): Promise<PaginatedResponse<PublicProduct>> {
  const { data } = await api.get(`/public/companies/${companyId}/products`, { params });
  return data;
}

export interface PublicProductVariant {
  id: string;
  name: string;
}

export async function getPublicProduct(
  productId: string,
  params: { variantId?: string; quantity?: number } = {},
): Promise<PublicProduct & { variants?: PublicProductVariant[]; availableStock: number }> {
  const { data } = await api.get(`/public/products/${productId}`, { params });
  return data;
}

// Banners dinámicos del home (backlog #5 marketplace-comprador.md, ver ADR-009):
// productos con descuento programado activo ahora mismo.
export async function getActivePromotions(): Promise<PromotionBanner[]> {
  const { data } = await api.get('/public/promotions');
  return data;
}

export async function searchPublicProducts(
  params: { page?: number; limit?: number; search?: string; category?: string } = {},
): Promise<PaginatedResponse<PublicProduct>> {
  const { data } = await api.get('/public/products', { params });
  return data;
}

// Reseñas (ver ADR-008). getCompanyReviews es público; las otras dos requieren
// sesión de comprador (ver isBuyerRoute en lib/api.ts).
export async function getCompanyReviews(
  companyId: string,
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedResponse<Review>> {
  const { data } = await api.get(`/public/companies/${companyId}/reviews`, { params });
  return data;
}

export async function getMyReviews(): Promise<Review[]> {
  const { data } = await api.get('/buyer-reviews/mine');
  return data;
}

export async function createReview(payload: { orderId: string; rating: number; comment?: string }): Promise<Review> {
  const { data } = await api.post('/buyer-reviews', payload);
  return data;
}

// Cotización de envío (ver ADR-012). Solo informativa en el checkout: el
// costo real que se cobra siempre se recalcula server-side en OrdersService.create.
export async function getShippingQuote(companyId: string, postalCode: string): Promise<ShippingQuote> {
  const { data } = await api.get(`/public/companies/${companyId}/shipping-quote`, { params: { postalCode } });
  return data;
}
