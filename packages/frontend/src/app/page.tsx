'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { CategoryChips } from '@/components/marketplace/CategoryChips';
import { StoreCard } from '@/components/marketplace/StoreCard';
import { CartStickyBar } from '@/components/cart/CartStickyBar';
import { BottomTabBar } from '@/components/nav/BottomTabBar';
import { getPublicCompanies } from '@/lib/marketplace';
import DemoCredentials from '@/components/DemoCredentials';

const PROMOS = [
  { title: 'Envío el mismo día', desc: 'Pedidos antes de las 14hs, en tu obra hoy.', gradient: 'from-orange-500 to-amber-500' },
  { title: 'Precios por volumen', desc: 'Descuentos automáticos a partir de ciertas cantidades.', gradient: 'from-slate-800 to-slate-700' },
  { title: 'Fabricantes verificados', desc: 'Comprá directo, sin intermediarios.', gradient: 'from-cyan-600 to-blue-600' },
];

export default function Home() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: companies, isLoading } = useQuery({
    queryKey: ['public-companies'],
    queryFn: getPublicCompanies,
  });

  function goToMarketplace(params: Record<string, string>) {
    const qs = new URLSearchParams(params).toString();
    router.push(qs ? `/marketplace?${qs}` : '/marketplace');
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) goToMarketplace({ search: search.trim() });
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-tabbar">
      <MarketplaceHeader showSearch={false} />

      {/* Hero + buscador prominente */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
          ¿Qué necesitás para tu obra?
        </h1>
        <p className="text-sm text-slate-500 mb-4">
          Materiales de construcción directo de fabricantes y distribuidores.
        </p>
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscá cemento, pisos, pintura..."
            className="w-full h-14 bg-white border border-slate-200 rounded-2xl pl-12 pr-4 text-base text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
          />
        </form>
      </section>

      {/* Chips de categoría */}
      <section className="max-w-7xl mx-auto">
        <CategoryChips value="" onChange={(key) => goToMarketplace(key ? { category: key } : {})} />
      </section>

      {/* Carrusel de promos */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {PROMOS.map((promo) => (
            <div
              key={promo.title}
              className={`shrink-0 w-72 h-32 rounded-2xl bg-gradient-to-br ${promo.gradient} p-5 flex flex-col justify-end text-white shadow-sm`}
            >
              <h3 className="font-bold text-base leading-tight">{promo.title}</h3>
              <p className="text-xs text-white/85 mt-1">{promo.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Grid de fabricantes/distribuidores */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Fabricantes y distribuidores</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <StoreCardSkeleton key={i} />)
            : companies?.length
              ? companies.map((c) => <StoreCard key={c.id} company={c} />)
              : <EmptyStores />}
        </div>
      </section>

      {/* Acceso demo (dev) — colapsado para no dominar la experiencia de comprador */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-700 select-none">
            ¿Sos del equipo ObraYa? Probar cuentas demo
          </summary>
          <div className="mt-4">
            <DemoCredentials />
          </div>
        </details>
      </section>

      <footer className="bg-slate-900 text-white py-8 mt-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-sm">
          <div>© {new Date().getFullYear()} ObraYa</div>
          <div className="flex gap-4 mt-4 md:mt-0 text-slate-300">
            <span>Política de privacidad</span>
            <span>Términos</span>
          </div>
        </div>
      </footer>

      <CartStickyBar />
      <BottomTabBar />
    </div>
  );
}

function StoreCardSkeleton() {
  return (
    <div className="card-ios p-4 flex items-center gap-3 animate-pulse">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-100 rounded-full w-2/3" />
        <div className="h-3 bg-slate-100 rounded-full w-1/2" />
      </div>
    </div>
  );
}

function EmptyStores() {
  return (
    <div className="col-span-full py-16 flex flex-col items-center gap-3 text-center">
      <span className="text-5xl">🏭</span>
      <h3 className="text-lg font-bold text-slate-800">Todavía no hay fabricantes activos</h3>
      <p className="text-slate-500 text-sm max-w-xs">Muy pronto vas a poder comprar directo a fabricantes y distribuidores verificados.</p>
    </div>
  );
}
