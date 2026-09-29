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

export type FleetType = 'propia' | 'tercerizada' | 'retiro_local';

// Zona de entrega configurada por el fabricante (ver ADR-012), con costo y
// tiempo prometido de envío. Reemplaza al viejo `coverageZones: string[]`.
export interface DeliveryZone {
  id: string;
  name: string;
  zipCodes: string[];
  promisedHours: number;
  fleetType: FleetType;
  shippingCost: number; // centavos de ARS
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

export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'MercadoPago';

// Datos públicos de una empresa/fabricante, sin autenticación (ver ADR-003).
// averageRating/reviewCount son datos reales agregados desde Review (ver ADR-008).
export interface PublicCompany {
  id: string;
  razonSocial: string;
  logoUrl?: string;
  city?: string;
  province?: string;
  coverageZones?: string[];
  averageRating?: number;
  reviewCount?: number;
}

// Cotización de envío pública (ver ADR-012, GET /public/companies/:id/shipping-quote).
export type ShippingQuote =
  | { available: true; zoneName: string; promisedHours: number; fleetType: FleetType; shippingCost: number }
  | { available: false };

// Reseña de un comprador sobre un pedido entregado (ver ADR-008).
export interface Review {
  id: string;
  buyerId: string;
  companyId: string;
  orderId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
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

// Banner de promoción activa en el home, derivado de Price.scheduledDiscount
// (ver ADR-009): no es una entidad propia, es el mismo descuento programado que
// ya resuelve el precio final del producto.
export interface PromotionBanner {
  productId: string;
  productName: string;
  image?: string;
  companyId: string;
  companyName?: string;
  label?: string;
  discountPercent: number;
  basePrice: number;
  finalPrice: number;
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
  shippingCost?: number;
  shippingZoneName?: string;
  currency: string;
  notes?: string;
  deliveryAddress?: OrderDeliveryAddress;
  createdAt: Date;
  updatedAt: Date;
  scheduledDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  paymentMethod?: PaymentMethod;
  mpPreferenceId?: string;
  mpPaymentId?: string;
  paymentUrl?: string;
  paymentStatus?: string;
}
