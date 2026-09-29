'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { CategoryChips } from '@/components/marketplace/CategoryChips';
import { StoreCard } from '@/components/marketplace/StoreCard';
import { ProductCard, ProductCardSkeleton, type ProductCardData } from '@/components/marketplace/ProductCard';
import { CartStickyBar } from '@/components/cart/CartStickyBar';
import { BottomTabBar } from '@/components/nav/BottomTabBar';
import { getPublicCompanies, getPublicProduct, getActivePromotions } from '@/lib/marketplace';
import { getStoredBuyer } from '@/lib/buyer-auth';
import { addToCart } from '@/lib/cart';
import { api, formatARS } from '@/lib/api';
import DemoCredentials from '@/components/DemoCredentials';
import type { Order } from '@obraya/shared';

const PROMOS = [
  { title: 'Envío el mismo día', desc: 'Pedidos antes de las 14hs, en tu obra hoy.', gradient: 'from-orange-500 to-amber-500' },
  { title: 'Precios por volumen', desc: 'Descuentos automáticos a partir de ciertas cantidades.', gradient: 'from-slate-800 to-slate-700' },
  { title: 'Fabricantes verificados', desc: 'Comprá directo, sin intermediarios.', gradient: 'from-cyan-600 to-blue-600' },
];

export default function Home() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [addedId, setAddedId] = useState<string | null>(null);
  const buyer = useMemo(() => getStoredBuyer(), []);

  const { data: companies, isLoading } = useQuery({
    queryKey: ['public-companies'],
    queryFn: getPublicCompanies,
  });

  // Banners dinámicos (backlog #5, ver ADR-009): productos con descuento
  // programado activo ahora. Si no hay ninguno (nadie programó un descuento
  // todavía), se cae a los banners genéricos de propuesta de valor.
  const { data: promotions } = useQuery({
    queryKey: ['active-promotions'],
    queryFn: getActivePromotions,
  });

  // "Mejor calificados": mismo dato que ya trae /public/companies (averageRating
  // real, ver ADR-008), ordenado client-side. Solo se muestran empresas con al
  // menos una reseña para no mezclar "sin calificar" con "mal calificado".
  const topRated = useMemo(
    () =>
      (companies ?? [])
        .filter((c) => (c.reviewCount ?? 0) > 0)
        .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
        .slice(0, 6),
    [companies],
  );

  // "Pedí de nuevo": productos distintos de los últimos pedidos del comprador
  // logueado (backlog #5 marketplace-comprador.md). Se re-resuelven contra
  // /public/products/:id para mostrar precio/imagen actuales, no los del pedido.
  const { data: buyerOrders } = useQuery({
    queryKey: ['buyer-orders'],
    queryFn: () => api.get('/buyer-orders').then((r) => r.data as Order[]),
    enabled: !!buyer,
  });

  const reorderProductIds = useMemo(() => {
    const orders = [...(buyerOrders ?? [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const seen = new Set<string>();
    for (const order of orders) {
      for (const item of order.items ?? []) {
        seen.add(item.productId);
        if (seen.size >= 8) break;
      }
      if (seen.size >= 8) break;
    }
    return Array.from(seen);
  }, [buyerOrders]);

  const reorderQueries = useQueries({
    queries: reorderProductIds.map((productId) => ({
      queryKey: ['public-product', productId],
      queryFn: () => getPublicProduct(productId),
      enabled: !!buyer,
      retry: false,
    })),
  });

  const reorderProducts: ProductCardData[] = reorderQueries
    .map((q) => q.data)
    .filter((p): p is NonNullable<typeof p> => !!p);
  const reorderLoading = !!buyer && reorderProductIds.length > 0 && reorderQueries.some((q) => q.isLoading);

  function handleQuickAdd(e: React.MouseEvent, product: ProductCardData) {
    e.preventDefault();
    const price = product.price?.finalPrice ?? product.price?.basePrice;
    addToCart({ productId: product.id, companyId: product.companyId, name: product.name, price, quantity: 1 });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  }

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

      {/* Carrusel de promos: productos con descuento activo (real), o los
          banners genéricos de propuesta de valor si todavía no hay ninguno */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {promotions?.length
            ? promotions.map((promo) => (
                <div
                  key={promo.productId}
                  role="button"
                  onClick={() => router.push(`/marketplace/products/${promo.productId}`)}
                  className="shrink-0 w-72 h-32 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 p-5 flex flex-col justify-end text-white shadow-sm cursor-pointer"
                >
                  <span className="text-xs font-bold uppercase tracking-wide text-white/90">
                    {promo.label ?? `${promo.discountPercent}% OFF`}
                  </span>
                  <h3 className="font-bold text-base leading-tight truncate">{promo.productName}</h3>
                  <p className="text-xs text-white/85 mt-1">
                    {formatARS(promo.finalPrice)}{' '}
                    <span className="line-through text-white/60">{formatARS(promo.basePrice)}</span>
                  </p>
                </div>
              ))
            : PROMOS.map((promo) => (
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

      {/* Pedí de nuevo (solo comprador logueado con pedidos previos) */}
      {buyer && (reorderLoading || reorderProducts.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Pedí de nuevo</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {reorderLoading && reorderProducts.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-40 shrink-0">
                    <ProductCardSkeleton />
                  </div>
                ))
              : reorderProducts.map((p) => (
                  <div key={p.id} className="w-40 shrink-0">
                    <ProductCard product={p} added={addedId === p.id} onQuickAdd={handleQuickAdd} />
                  </div>
                ))}
          </div>
        </section>
      )}

      {/* Fabricantes mejor calificados (rating real, ver ADR-008) */}
      {topRated.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Mejor calificados</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {topRated.map((c) => (
              <div key={c.id} className="w-72 shrink-0">
                <StoreCard company={c} />
              </div>
            ))}
          </div>
        </section>
      )}

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
