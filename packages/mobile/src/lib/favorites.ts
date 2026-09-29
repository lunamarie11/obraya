import { api } from './api';

// Espejo de packages/frontend/src/lib/favorites.ts (ver docs/specs/marketplace-comprador.md,
// backlog #4). Requiere sesión de Buyer; /buyer-favorites ya usa el token dual
// configurado en lib/api.ts.
export type BuyerFavoriteType = 'product' | 'company';

export interface BuyerFavorite {
  id: string;
  type: BuyerFavoriteType;
  targetId: string;
  createdAt: string;
}

export async function getBuyerFavorites(): Promise<BuyerFavorite[]> {
  const { data } = await api.get('/buyer-favorites');
  return data;
}

export async function addBuyerFavorite(type: BuyerFavoriteType, targetId: string): Promise<BuyerFavorite> {
  const { data } = await api.post('/buyer-favorites', { type, targetId });
  return data;
}

export async function removeBuyerFavorite(type: BuyerFavoriteType, targetId: string): Promise<void> {
  await api.delete(`/buyer-favorites/${type}/${targetId}`);
}
