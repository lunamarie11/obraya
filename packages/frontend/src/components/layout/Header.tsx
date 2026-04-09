'use client';

import { Bell } from 'lucide-react';
import { getStoredUser } from '@/lib/auth';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const user = getStoredUser();

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-4">
        <button className="relative text-slate-500 hover:text-slate-800 transition-colors">
          <Bell size={20} />
          {/* Badge de notificaciones — implementar en Fase 2 */}
        </button>
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="text-sm">
              <p className="font-medium text-slate-800">{user.firstName} {user.lastName}</p>
              <p className="text-slate-400 text-xs">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
