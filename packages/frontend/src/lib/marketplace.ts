import { api } from '@/lib/api';
import type { PublicCompany, PublicProduct } from '@obraya/shared';

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

export async function searchPublicProducts(
  params: { page?: number; limit?: number; search?: string; category?: string } = {},
): Promise<PaginatedResponse<PublicProduct>> {
  const { data } = await api.get('/public/products', { params });
  return data;
}
