'use client';

import Link from 'next/link';
import { Search, ChevronLeft, Heart } from 'lucide-react';
import CartButton from '@/components/CartButton';
import { getStoredBuyer } from '@/lib/buyer-auth';
import { useEffect, useState } from 'react';

interface Props {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  showSearch?: boolean;
  showBack?: boolean;
  backHref?: string;
  title?: string;
}

export function MarketplaceHeader({
  searchValue = '',
  onSearchChange,
  showSearch = true,
  showBack = false,
  backHref = '/marketplace',
  title,
}: Props) {
  const [buyer, setBuyer] = useState<any>(null);

  useEffect(() => {
    setBuyer(getStoredBuyer());
  }, []);

  return (
    <header className="sticky top-0 z-50 glass border-b border-slate-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 h-16">
          {showBack ? (
            <Link
              href={backHref}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors shrink-0"
            >
              <ChevronLeft size={20} className="text-slate-700" />
            </Link>
          ) : (
            <Link href="/" className="text-xl font-extrabold shrink-0 tracking-tight">
              Obra<span className="text-orange-500">Ya</span>
            </Link>
          )}

          {title && !showSearch && (
            <h1 className="font-bold text-lg text-slate-900 truncate flex-1">{title}</h1>
          )}

          {showSearch && (
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="search"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="¿Qué material necesitás?"
                className="w-full bg-slate-100 border-0 rounded-full pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
              />
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {buyer && (
              <Link
                href="/favorites"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <Heart size={17} className="text-slate-600" />
              </Link>
            )}
            <CartButton />
            {buyer ? (
              <Link
                href="/my-orders"
                className="hidden sm:flex items-center h-9 px-4 rounded-full bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
              >
                Mi cuenta
              </Link>
            ) : (
              <Link
                href="/account"
                className="hidden sm:flex items-center h-9 px-4 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
              >
                Ingresar
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
