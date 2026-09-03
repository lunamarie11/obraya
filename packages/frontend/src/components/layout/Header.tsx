'use client';

import { Bell } from 'lucide-react';
import { getStoredUser } from '@/lib/auth';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const user = getStoredUser();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div>
        <h1 className="text-base font-bold text-slate-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <Bell size={18} />
        </button>
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-tight">{user.firstName} {user.lastName}</p>
              <p className="text-slate-400 text-xs">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
