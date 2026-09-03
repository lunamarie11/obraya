'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { formatARS } from '@/lib/api';

// Aparece apenas hay algo en el carrito (patrón Rappi: barra flotante con
// contador + total, sin tener que navegar a otra pantalla). Se auto-oculta en
// /cart y /checkout, donde el resumen ya está a la vista.
export function CartStickyBar() {
  const pathname = usePathname();
  const { count, total } = useCart();

  if (count === 0) return null;
  if (pathname === '/cart' || pathname?.startsWith('/checkout')) return null;

  return (
    <div className="sticky-bar px-4 sm:px-6 pb-4 sm:pb-6 pointer-events-none">
      <Link
        href="/cart"
        className="pointer-events-auto max-w-md mx-auto flex items-center justify-between gap-3 bg-slate-900 text-white rounded-2xl px-4 py-3.5 shadow-lg hover:bg-slate-800 transition-colors btn-ios"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/15">
            <ShoppingBag size={16} />
            <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {count > 99 ? '99+' : count}
            </span>
          </span>
          Ver carrito
        </span>
        <span className="flex items-center gap-1 font-bold">
          {formatARS(total)}
          <ChevronRight size={16} />
        </span>
      </Link>
    </div>
  );
}
