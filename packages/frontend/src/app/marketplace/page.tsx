'use client';

import React, { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { clsx } from 'clsx';
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { addToCart } from '@/lib/cart';
import { searchPublicProducts } from '@/lib/marketplace';
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { CategoryChips } from '@/components/marketplace/CategoryChips';
import { CATEGORIES } from '@/components/marketplace/categories';
import { ProductCard, ProductCardSkeleton, type ProductCardData } from '@/components/marketplace/ProductCard';
import { CartStickyBar } from '@/components/cart/CartStickyBar';
import { BottomTabBar } from '@/components/nav/BottomTabBar';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'name_asc', label: 'Nombre A→Z' },
];

function fetchProducts({ queryKey }: any) {
  const [, { page, search, category }] = queryKey;
  const params: Record<string, any> = { page, limit: 12 };
  if (search) params.search = search;
  if (category) params.category = category;
  return searchPublicProducts(params);
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={null}>
      <MarketplacePageInner />
    </Suspense>
  );
}

function MarketplacePageInner() {
  const searchParams = useSearchParams();
  const [search, setSearch] = React.useState(() => searchParams?.get('search') ?? '');
  const [debouncedSearch, setDebouncedSearch] = React.useState(() => searchParams?.get('search') ?? '');
  const [category, setCategory] = React.useState(() => searchParams?.get('category') ?? '');
  const [sort, setSort] = React.useState('relevance');
  const [page, setPage] = React.useState(1);
  const [showFilters, setShowFilters] = React.useState(false);
  const [minPrice, setMinPrice] = React.useState('');
  const [maxPrice, setMaxPrice] = React.useState('');
  const [addedId, setAddedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, search: debouncedSearch, category }],
    queryFn: fetchProducts,
  });

  let products: any[] = data?.data ?? [];

  const minP = Number(minPrice) || null;
  const maxP = Number(maxPrice) || null;
  if (minP || maxP) {
    products = products.filter((p: any) => {
      const price = p.price?.basePrice ?? p.price?.finalPrice;
      if (!price) return false;
      if (minP && price < minP * 100) return false;
      if (maxP && price > maxP * 100) return false;
      return true;
    });
  }
  if (sort === 'price_asc') products = [...products].sort((a, b) => (a.price?.basePrice ?? 0) - (b.price?.basePrice ?? 0));
  if (sort === 'price_desc') products = [...products].sort((a, b) => (b.price?.basePrice ?? 0) - (a.price?.basePrice ?? 0));
  if (sort === 'name_asc') products = [...products].sort((a, b) => a.name.localeCompare(b.name));

  function handleQuickAdd(e: React.MouseEvent, product: ProductCardData) {
    e.preventDefault();
    const price = product.price?.finalPrice ?? product.price?.basePrice;
    addToCart({ productId: product.id, companyId: product.companyId, name: product.name, price, quantity: 1 });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  }

  const totalPages = data?.totalPages ?? 1;
  const activeFilters = [minPrice, maxPrice].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-tabbar">
      <MarketplaceHeader searchValue={search} onSearchChange={setSearch} />

      {/* Category pills */}
      <div className="sticky top-16 z-40 glass border-b border-slate-100/80">
        <CategoryChips value={category} onChange={(key) => { setCategory(key); setPage(1); }} />
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5 gap-3">
          <p className="text-sm text-slate-500">
            {isLoading ? 'Buscando...' : `${data?.total ?? 0} producto${data?.total !== 1 ? 's' : ''}`}
            {category ? ` en ${CATEGORIES.find((c) => c.key === category)?.label}` : ''}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={clsx(
                'flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold transition-all btn-ios',
                showFilters ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
              )}
            >
              <SlidersHorizontal size={14} />
              Filtros
              {activeFilters > 0 && (
                <span className="bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center ml-0.5">
                  {activeFilters}
                </span>
              )}
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-full text-sm font-semibold bg-white border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="card-ios p-4 mb-5 flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-32">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Precio mín (ARS)</label>
              <input
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 border-0"
              />
            </div>
            <div className="flex-1 min-w-32">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Precio máx (ARS)</label>
              <input
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Sin límite"
                className="w-full bg-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 border-0"
              />
            </div>
            <button
              onClick={() => { setMinPrice(''); setMaxPrice(''); }}
              className="flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors btn-ios"
            >
              <X size={14} /> Limpiar
            </button>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.length === 0
              ? <EmptyState />
              : products.map((p: ProductCardData) => (
                <ProductCard key={p.id} product={p} added={addedId === p.id} onQuickAdd={handleQuickAdd} />
              ))
          }
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors btn-ios"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-slate-600">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors btn-ios"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </main>

      <CartStickyBar />
      <BottomTabBar />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full py-20 flex flex-col items-center gap-4 text-center">
      <span className="text-6xl">🔍</span>
      <h3 className="text-xl font-bold text-slate-800">Sin resultados</h3>
      <p className="text-slate-500 text-sm max-w-xs">
        No encontramos productos con esos criterios. Probá con otra búsqueda o categoría.
      </p>
    </div>
  );
}
