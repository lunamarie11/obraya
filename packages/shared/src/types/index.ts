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

export type OrderStatus = 'Nuevo' | 'Aceptado' | 'Preparacion' | 'Despachado' | 'Entregado' | 'Cancelado';

// Datos públicos de una empresa/fabricante, sin autenticación (ver ADR-003).
// Solo campos que ya existen en la entidad Company del backend.
export interface PublicCompany {
  id: string;
  razonSocial: string;
  logoUrl?: string;
  city?: string;
  province?: string;
  coverageZones?: string[];
}

// Producto tal como lo expone el catálogo público (ver ADR-003).
export interface PublicProduct {
  id: string;
  companyId: string;
  companyName?: string;
  name: string;
  category?: string;
  images?: string[];
  price?: {
    basePrice: number;
    finalPrice: number;
    discountPercent: number;
  };
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  productName?: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountPercent?: number;
  notes?: string;
}

export interface OrderDeliveryAddress {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string;
}

export interface Order {
  id: string;
  companyId: string;
  buyerId: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  orderNumber: string;
  status: OrderStatus;
  rejectionReason?: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  notes?: string;
  deliveryAddress?: OrderDeliveryAddress;
  createdAt: Date;
  updatedAt: Date;
  scheduledDeliveryDate?: Date;
  actualDeliveryDate?: Date;
}
