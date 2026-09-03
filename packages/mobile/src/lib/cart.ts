import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

// Espejo de packages/frontend/src/lib/cart.ts. AsyncStorage es asíncrono (a
// diferencia de localStorage), así que estas funciones devuelven Promise. El evento
// 'cart:update' reemplaza al CustomEvent del DOM que usaba la versión web.
export type CartItem = {
  productId: string;
  variantId?: string | null;
  companyId: string;
  name: string;
  price?: number;
  quantity: number;
};

const KEY = 'obraya_cart_v1';
const EVENT = 'cart:update';

export async function getCart(): Promise<CartItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveCart(items: CartItem[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
  DeviceEventEmitter.emit(EVENT);
}

export function subscribeToCart(listener: () => void) {
  const sub = DeviceEventEmitter.addListener(EVENT, listener);
  return () => sub.remove();
}

export async function getCartCount(): Promise<number> {
  const items = await getCart();
  return items.reduce((s, it) => s + (it.quantity || 0), 0);
}

export async function addToCart(item: CartItem) {
  const items = await getCart();
  const idx = items.findIndex((it) => it.productId === item.productId && (it.variantId || null) === (item.variantId || null));
  if (idx >= 0) {
    items[idx].quantity = (items[idx].quantity || 0) + item.quantity;
  } else {
    items.push(item);
  }
  await saveCart(items);
}

export async function updateCartItemQuantity(productId: string, variantId: string | null, quantity: number) {
  const items = await getCart();
  const idx = items.findIndex((it) => it.productId === productId && (it.variantId || null) === variantId);
  if (idx >= 0) {
    if (quantity <= 0) {
      items.splice(idx, 1);
    } else {
      items[idx].quantity = quantity;
    }
    await saveCart(items);
  }
}

export async function clearCart() {
  await saveCart([]);
}

export async function removeFromCart(productId: string, variantId?: string) {
  const items = (await getCart()).filter((it) => !(it.productId === productId && (it.variantId || null) === (variantId || null)));
  await saveCart(items);
}

// El carrito puede tener productos de varios fabricantes (companyId). El checkout
// crea un pedido por fabricante — ver ADR-006.
export async function getCartGroupedByCompany(): Promise<{ companyId: string; items: CartItem[] }[]> {
  const groups = new Map<string, CartItem[]>();
  for (const item of await getCart()) {
    const group = groups.get(item.companyId) ?? [];
    group.push(item);
    groups.set(item.companyId, group);
  }
  return Array.from(groups.entries()).map(([companyId, items]) => ({ companyId, items }));
}
