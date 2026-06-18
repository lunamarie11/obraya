'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck, LayoutDashboard, Building2, Users,
  ShoppingCart, Package, LogOut,
} from 'lucide-react';
import { clsx } from 'clsx';
import { logout, getStoredUser } from '@/lib/auth';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/superadmin/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/superadmin/companies',  label: 'Empresas',   icon: Building2 },
  { href: '/superadmin/users',      label: 'Usuarios',   icon: Users },
  { href: '/superadmin/orders',     label: 'Pedidos',    icon: ShoppingCart },
  { href: '/superadmin/products',   label: 'Productos',  icon: Package },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const user = getStoredUser();
    if (user) setUserName(`${user.firstName} ${user.lastName}`);
  }, []);

  return (
    <aside className="w-60 min-h-screen bg-slate-800 border-r border-slate-700 flex flex-col">
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-orange-400" />
          <span className="text-white font-bold text-lg tracking-tight">
            Obra<span className="text-orange-400">Ya</span>
          </span>
        </div>
        <p className="text-slate-500 text-xs mt-0.5 ml-6">Super Admin</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
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

      <div className="px-3 py-4 border-t border-slate-700 space-y-1">
        {userName && (
          <p className="px-3 text-xs text-slate-500 truncate">{userName}</p>
        )}
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
