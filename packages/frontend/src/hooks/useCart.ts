'use client';

import React from 'react';
import { getCart, type CartItem } from '@/lib/cart';

export function useCart() {
  const [cart, setCart] = React.useState<CartItem[]>([]);

  React.useEffect(() => {
    function refresh() { setCart(getCart()); }
    refresh();
    window.addEventListener('cart:update', refresh);
    return () => window.removeEventListener('cart:update', refresh);
  }, []);

  const count = cart.reduce((s, it) => s + (it.quantity || 0), 0);
  const total = cart.reduce((s, it) => s + (it.price ?? 0) * it.quantity, 0);

  return { cart, count, total };
}
