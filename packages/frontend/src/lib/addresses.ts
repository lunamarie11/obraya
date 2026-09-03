import { api } from './api';

export interface BuyerAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string | null;
  isDefault: boolean;
}

export type BuyerAddressInput = {
  label?: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string;
  isDefault?: boolean;
};

// Libreta de direcciones del comprador — ver ADR-006 y
// docs/specs/marketplace-comprador.md (backlog #3). Requiere sesión de Buyer;
// las rutas /buyer-addresses ya usan el token dual configurado en lib/api.ts.
export async function getBuyerAddresses(): Promise<BuyerAddress[]> {
  const { data } = await api.get('/buyer-addresses');
  return data;
}

export async function createBuyerAddress(payload: BuyerAddressInput): Promise<BuyerAddress> {
  const { data } = await api.post('/buyer-addresses', payload);
  return data;
}

export async function deleteBuyerAddress(id: string): Promise<void> {
  await api.delete(`/buyer-addresses/${id}`);
}
