'use client';

import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import Link from 'next/link';

export default function CartButton() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      className="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-orange-50 transition-colors"
    >
      <ShoppingBag size={20} className="text-slate-700" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
