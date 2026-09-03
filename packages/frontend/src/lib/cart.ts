export type CartItem = {
  productId: string;
  variantId?: string | null;
  companyId: string;
  name: string;
  price?: number;
  quantity: number;
};

const KEY = 'obraya_cart_v1';

export function getCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('cart:update'));
}

export function getCartCount() {
  return getCart().reduce((s, it) => s + (it.quantity || 0), 0);
}

export function addToCart(item: CartItem) {
  const items = getCart();
  const idx = items.findIndex((it) => it.productId === item.productId && (it.variantId || null) === (item.variantId || null));
  if (idx >= 0) {
    items[idx].quantity = (items[idx].quantity || 0) + item.quantity;
  } else {
    items.push(item);
  }
  saveCart(items);
}

export function updateCartItemQuantity(productId: string, variantId: string | null, quantity: number) {
  const items = getCart();
  const idx = items.findIndex((it) => it.productId === productId && (it.variantId || null) === variantId);
  if (idx >= 0) {
    if (quantity <= 0) {
      items.splice(idx, 1);
    } else {
      items[idx].quantity = quantity;
    }
    saveCart(items);
  }
}

export function clearCart() {
  saveCart([]);
}

export function removeFromCart(productId: string, variantId?: string) {
  const items = getCart().filter((it) => !(it.productId === productId && (it.variantId || null) === (variantId || null)));
  saveCart(items);
}

// El carrito puede tener productos de varios fabricantes (companyId). El checkout
// crea un pedido por fabricante — ver ADR-006.
export function getCartGroupedByCompany(): { companyId: string; items: CartItem[] }[] {
  const groups = new Map<string, CartItem[]>();
  for (const item of getCart()) {
    const group = groups.get(item.companyId) ?? [];
    group.push(item);
    groups.set(item.companyId, group);
  }
  return Array.from(groups.entries()).map(([companyId, items]) => ({ companyId, items }));
}

export default {
  getCart,
  saveCart,
  addToCart,
  updateCartItemQuantity,
  getCartCount,
  clearCart,
  removeFromCart,
  getCartGroupedByCompany,
};
