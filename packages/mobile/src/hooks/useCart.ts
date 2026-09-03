import { useCallback, useEffect, useState } from 'react';
import { getCart, subscribeToCart, type CartItem } from '../lib/cart';

// Espejo de packages/frontend/src/hooks/useCart.ts. getCart() es async acá
// (AsyncStorage), así que el refresh se dispara con subscribeToCart en vez
// de un listener de window.
export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const refresh = useCallback(() => {
    getCart().then(setCart);
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToCart(refresh);
    return unsubscribe;
  }, [refresh]);

  const count = cart.reduce((s, it) => s + (it.quantity || 0), 0);
  const total = cart.reduce((s, it) => s + (it.price ?? 0) * it.quantity, 0);

  return { cart, count, total, refresh };
}
