'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck, LayoutDashboard, Building2, Users,
  ShoppingCart, Package, LogOut, Activity,
} from 'lucide-react';
import { clsx } from 'clsx';
import { logout, getStoredUser } from '@/lib/auth';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/superadmin/dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/superadmin/monitoring',  label: 'Monitoreo',    icon: Activity },
  { href: '/superadmin/companies',   label: 'Empresas',     icon: Building2 },
  { href: '/superadmin/users',       label: 'Usuarios',     icon: Users },
  { href: '/superadmin/orders',      label: 'Pedidos',      icon: ShoppingCart },
  { href: '/superadmin/products',    label: 'Productos',    icon: Package },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-100 border border-orange-200 rounded-xl flex items-center justify-center">
            <ShieldCheck size={18} className="text-orange-500" />
          </div>
          <div>
            <span className="text-slate-900 font-extrabold text-lg tracking-tight">
              Obra<span className="text-orange-500">Ya</span>
            </span>
            <p className="text-slate-400 text-[11px] leading-none mt-0.5">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = (pathname ?? '') === href || (pathname ?? '').startsWith(href + '/');
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
      <div className="px-3 py-4 border-t border-slate-200 space-y-1">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-slate-900 text-sm font-semibold truncate">{user.firstName} {user.lastName}</p>
              <p className="text-orange-500 text-xs truncate">Super Admin</p>
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
