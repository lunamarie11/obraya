'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { getPublicCompany, getPublicCompanyProducts, getCompanyReviews } from '@/lib/marketplace';
import { addToCart } from '@/lib/cart';
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { ProductCard, ProductCardSkeleton, type ProductCardData } from '@/components/marketplace/ProductCard';
import { CartStickyBar } from '@/components/cart/CartStickyBar';
import { BottomTabBar } from '@/components/nav/BottomTabBar';

export default function CompanyStorePage() {
  const params = useParams<{ companyId: string }>();
  const companyId = params?.companyId ?? '';

  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [addedId, setAddedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: company } = useQuery({
    queryKey: ['public-company', companyId],
    queryFn: () => getPublicCompany(companyId),
    enabled: !!companyId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['public-company-products', companyId, debouncedSearch],
    queryFn: () => getPublicCompanyProducts(companyId, { search: debouncedSearch || undefined, limit: 100 }),
    enabled: !!companyId,
  });

  const { data: reviews } = useQuery({
    queryKey: ['public-company-reviews', companyId],
    queryFn: () => getCompanyReviews(companyId, { limit: 10 }),
    enabled: !!companyId,
  });

  const products: ProductCardData[] = data?.data ?? [];

  const grouped = React.useMemo(() => {
    const groups = new Map<string, ProductCardData[]>();
    for (const p of products) {
      const key = p.category || 'Otros';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }
    return Array.from(groups.entries());
  }, [products]);

  function handleQuickAdd(e: React.MouseEvent, product: ProductCardData) {
    e.preventDefault();
    const price = product.price?.finalPrice ?? product.price?.basePrice;
    addToCart({ productId: product.id, companyId: product.companyId, name: product.name, price, quantity: 1 });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-tabbar">
      <MarketplaceHeader
        showBack
        backHref="/"
        showSearch={false}
        title={company?.razonSocial ?? 'Tienda'}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {company && (
          <div className="mb-4 flex items-center gap-2 text-sm">
            {company.reviewCount ? (
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                {company.averageRating?.toFixed(1)}
                <span className="text-slate-400 font-normal">({company.reviewCount} reseñas)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400">
                <Star size={14} />
                Todavía sin reseñas
              </span>
            )}
          </div>
        )}

        <div className="relative mb-6">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Buscar en ${company?.razonSocial ?? 'esta tienda'}...`}
            className="w-full h-11 bg-white border border-slate-200 rounded-full pl-4 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-center">
            <span className="text-5xl">📦</span>
            <h3 className="text-lg font-bold text-slate-800">Sin productos</h3>
            <p className="text-slate-500 text-sm max-w-xs">Esta tienda todavía no tiene productos publicados con esa búsqueda.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(([category, items]) => (
              <section key={category}>
                <h2 className="text-lg font-bold text-slate-900 mb-3">{category}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      added={addedId === p.id}
                      onQuickAdd={handleQuickAdd}
                      showStore={false}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {!!reviews?.data?.length && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Reseñas de compradores</h2>
            <div className="space-y-3">
              {reviews.data.map((review) => (
                <div key={review.id} className="card-ios p-4">
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                      />
                    ))}
                    <span className="text-xs text-slate-400 ml-2">
                      {new Date(review.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {review.comment && <p className="text-sm text-slate-700">{review.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <CartStickyBar />
      <BottomTabBar />
    </div>
  );
}
