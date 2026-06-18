'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  BarChart2,
  Settings,
  LogOut,
  Truck,
  History,
} from 'lucide-react';
import { clsx } from 'clsx';
import { logout, getStoredUser } from '@/lib/auth';

const MAIN_NAV = [
  { href: '/dashboard', label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/orders',    label: 'Pedidos',         icon: ShoppingCart },
  { href: '/products',  label: 'Productos',       icon: Package },
  { href: '/stock',     label: 'Stock',           icon: Warehouse },
  { href: '/reports',   label: 'Reportes',        icon: BarChart2 },
  { href: '/settings',  label: 'Configuración',   icon: Settings },
];

const DELIVERY_NAV = [
  { href: '/delivery', label: 'Mis Entregas', icon: Truck },
  { href: '/delivery/history', label: 'Historial', icon: History },
];

export function Sidebar() {
  const pathname = usePathname();
  const [nav, setNav] = useState(MAIN_NAV as typeof MAIN_NAV | typeof DELIVERY_NAV);

  useEffect(() => {
    const user = getStoredUser();
    if (user?.role === 'Logistica') setNav(DELIVERY_NAV);
  }, []);

  return (
    <aside className="w-60 min-h-screen bg-slate-800 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <span className="text-white font-bold text-xl tracking-tight">
          Obra<span className="text-orange-400">Ya</span>
        </span>
        <p className="text-slate-400 text-xs mt-0.5">Backoffice</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700',
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700 transition-colors w-full"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
