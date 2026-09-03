'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Heart, LogIn, ArrowRight } from 'lucide-react';
import { addToCart } from '@/lib/cart';
import { getPublicProduct, getPublicCompany } from '@/lib/marketplace';
import { useFavorites } from '@/hooks/useFavorites';
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { StoreCard } from '@/components/marketplace/StoreCard';
import { ProductCard, ProductCardSkeleton, type ProductCardData } from '@/components/marketplace/ProductCard';
import { BottomTabBar } from '@/components/nav/BottomTabBar';
import type { PublicCompany } from '@obraya/shared';

// Página de favoritos (backlog #4 marketplace-comprador.md). Los favoritos
// del backend solo guardan {type, targetId}; acá se resuelven contra el
// catálogo público (/public/products, /public/companies) para mostrar la
// info completa, igual que ya se hace en el resto del marketplace.
export default function FavoritesPage() {
  const { buyer, favorites } = useFavorites();
  const [addedId, setAddedId] = React.useState<string | null>(null);

  const productIds = favorites.filter((f) => f.type === 'product').map((f) => f.targetId);
  const companyIds = favorites.filter((f) => f.type === 'company').map((f) => f.targetId);

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['favorite-products', productIds],
    queryFn: () => Promise.all(productIds.map((id) => getPublicProduct(id))),
    enabled: !!buyer && productIds.length > 0,
  });

  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['favorite-companies', companyIds],
    queryFn: () => Promise.all(companyIds.map((id) => getPublicCompany(id))),
    enabled: !!buyer && companyIds.length > 0,
  });

  function handleQuickAdd(e: React.MouseEvent, product: ProductCardData) {
    e.preventDefault();
    const price = product.price?.finalPrice ?? product.price?.basePrice;
    addToCart({ productId: product.id, companyId: product.companyId, name: product.name, price, quantity: 1 });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  }

  if (!buyer) {
    return (
      <div className="min-h-screen bg-slate-50">
        <MarketplaceHeader showSearch={false} showBack backHref="/marketplace" title="Favoritos" />
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <LogIn size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Ingresá para ver tus favoritos</h2>
          <p className="text-slate-500 mb-6">Guardá los productos y fabricantes que más te interesan.</p>
          <Link href="/account" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-colors btn-ios">
            Ingresar <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const isEmpty = favorites.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-tabbar">
      <MarketplaceHeader showSearch={false} showBack backHref="/marketplace" title="Favoritos" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {isEmpty ? (
          <div className="py-20 flex flex-col items-center gap-4 text-center">
            <Heart size={48} className="text-slate-200" />
            <h3 className="text-xl font-bold text-slate-800">Todavía no tenés favoritos</h3>
            <p className="text-slate-500 text-sm max-w-xs">
              Tocá el corazón en un producto o fabricante para guardarlo acá.
            </p>
          </div>
        ) : (
          <>
            {companyIds.length > 0 && (
              <section>
                <h2 className="font-bold text-lg text-slate-900 mb-3">Fabricantes</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {loadingCompanies
                    ? Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="card-ios h-20 animate-pulse" />
                      ))
                    : (companies as PublicCompany[]).map((c) => <StoreCard key={c.id} company={c} />)}
                </div>
              </section>
            )}

            {productIds.length > 0 && (
              <section>
                <h2 className="font-bold text-lg text-slate-900 mb-3">Productos</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {loadingProducts
                    ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                    : (products as ProductCardData[]).map((p) => (
                        <ProductCard key={p.id} product={p} added={addedId === p.id} onQuickAdd={handleQuickAdd} />
                      ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <BottomTabBar />
    </div>
  );
}
