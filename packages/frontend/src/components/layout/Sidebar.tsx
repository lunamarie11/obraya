'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart,
  BarChart2, Settings, LogOut, Truck, History, HardHat,
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
  { href: '/delivery',         label: 'Mis Entregas', icon: Truck },
  { href: '/delivery/history', label: 'Historial',    icon: History },
];

export function Sidebar() {
  const pathname = usePathname();
  const [nav, setNav] = useState(MAIN_NAV as typeof MAIN_NAV | typeof DELIVERY_NAV);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    if (u?.role === 'Logistica') setNav(DELIVERY_NAV);
  }, []);

  return (
    <aside className="w-64 min-h-screen bg-white flex flex-col border-r border-slate-200 shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm">
            <HardHat size={18} className="text-white" />
          </div>
          <div>
            <span className="text-slate-900 font-extrabold text-lg tracking-tight">
              Obra<span className="text-orange-500">Ya</span>
            </span>
            <p className="text-slate-400 text-[11px] leading-none mt-0.5">Panel de gestión</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = (pathname ?? '').startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                active
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-orange-50',
              )}
            >
              <Icon size={17} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-slate-100 space-y-1">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-slate-900 text-sm font-semibold truncate">{user.firstName} {user.lastName}</p>
              <p className="text-slate-400 text-xs truncate">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
        >
          <LogOut size={17} className="shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
