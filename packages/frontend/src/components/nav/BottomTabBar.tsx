'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Home, Package, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

const TABS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/my-orders', label: 'Pedidos', icon: Package },
  { href: '/cart', label: 'Carrito', icon: ShoppingBag },
  { href: '/account', label: 'Perfil', icon: User },
] as const;

// Solo visible en mobile (md:hidden) — es un elemento fixed, no participa del
// flujo normal, así que no puede romper el layout desktop existente.
export function BottomTabBar() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <nav className="sticky-bar md:hidden bg-white/95 backdrop-blur border-t border-slate-200 flex items-stretch">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const active = tab.href === '/' ? pathname === '/' : pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors relative',
              active ? 'text-orange-500' : 'text-slate-400',
            )}
          >
            <span className="relative">
              <Icon size={20} />
              {tab.href === '/cart' && count > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
