// Shared TypeScript types between backend, frontend, and mobile

export interface Company {
  id: string;
  name: string;
  legalName?: string;
  cuit?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyUser {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Vendedor' | 'Logistica' | 'Contabilidad';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Stock {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  warehouseLocation?: string;
  lastRestockDate?: Date;
  updatedAt: Date;
}

export interface Price {
  id: string;
  productId: string;
  variantId?: string;
  baseCost?: number;
  sellingPrice: number;
  currency: string; // 'ARS', 'USD', etc.
  effectiveFrom: Date;
  effectiveTo?: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  category?: string;
  sku?: string;
  images?: string[];
  technicalSheetUrl?: string;
  variants?: ProductVariant[];
  stock?: Stock;
  price?: Price;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: string;
  companyId: string;
  buyerId: string;
  orderNumber: string;
  status: 'Nuevo' | 'Aceptado' | 'Preparacion' | 'Despachado' | 'Entregado' | 'Cancelado';
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  scheduledDeliveryDate?: Date;
  actualDeliveryDate?: Date;
}
