'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatARS } from '@/lib/api';
import { getPublicProduct } from '@/lib/marketplace';
import { addToCart } from '@/lib/cart';
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { CartStickyBar } from '@/components/cart/CartStickyBar';
import { BottomTabBar } from '@/components/nav/BottomTabBar';
import { Package, Store, Tag, Layers, Minus, Plus, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(null);
  const [qty, setQty] = React.useState(1);
  const [added, setAdded] = React.useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['public-product', id, selectedVariantId, qty],
    queryFn: () => getPublicProduct(id, { variantId: selectedVariantId ?? undefined, quantity: qty }),
  });

  // availableStock viene del propio endpoint público (ver ADR-003) — ya no se
  // llama a GET /stock/:id, que estaba scopeado a la empresa del usuario
  // logueado y mostraba "sin stock" en cualquier producto ajeno.
  const totalStock = product?.availableStock ?? null;

  React.useEffect(() => {
    if (product?.images?.length) setSelectedImage(product.images[0]);
    if (product?.variants?.length && !selectedVariantId) setSelectedVariantId(product.variants[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  function handleAddToCart() {
    if (!product) return;
    addToCart({
      productId: product.id,
      variantId: selectedVariantId,
      companyId: product.companyId,
      name: product.name,
      price: product.price?.finalPrice ?? product.price?.basePrice,
      quantity: qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  if (isLoading) return <LoadingState />;
  if (error || !product) return <ErrorState />;

  const images: string[] = product.images ?? [];
  const variants = product.variants ?? [];
  const price = product.price?.finalPrice ?? product.price?.basePrice;
  const basePrice = product.price?.basePrice;
  const hasDiscount = (product.price?.discountPercent ?? 0) > 0;
  const outOfStock = totalStock === 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-tabbar">
      <MarketplaceHeader showBack backHref="/marketplace" showSearch={false} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image gallery */}
          <div className="space-y-3">
            <div className="card-ios overflow-hidden">
              <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 aspect-square flex items-center justify-center">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 opacity-30">
                    <Package size={64} className="text-slate-400" />
                    <span className="text-sm text-slate-400 font-medium">Sin imagen</span>
                  </div>
                )}
              </div>
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {images.map((img) => (
                  <button
                    key={img}
                    onClick={() => setSelectedImage(img)}
                    className={clsx(
                      'shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all',
                      selectedImage === img ? 'border-orange-500' : 'border-transparent opacity-60 hover:opacity-100',
                    )}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            {product.companyName && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm font-medium">
                <Store size={14} />
                {product.companyName}
              </div>
            )}

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mb-1">
                {product.name}
              </h1>
            </div>

            {/* Price */}
            <div className="card-ios p-4">
              {price ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-slate-900">{formatARS(price)}</span>
                  {hasDiscount && (
                    <>
                      <span className="text-lg text-slate-400 line-through font-medium">{formatARS(basePrice!)}</span>
                      <span className="text-sm font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                        -{product.price?.discountPercent}%
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Precio no disponible</p>
              )}
            </div>

            {/* Variants */}
            {variants.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Layers size={14} /> Variantes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={clsx(
                        'px-4 py-2 rounded-full text-sm font-semibold transition-all btn-ios',
                        selectedVariantId === v.id
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                      )}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Cantidad</h3>
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center font-bold text-slate-900">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-11 h-11 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div className={clsx('w-2 h-2 rounded-full', outOfStock ? 'bg-red-400' : 'bg-green-500')} />
              <span className="text-sm text-slate-600">
                {outOfStock ? 'Sin stock disponible' : `${totalStock} unidades disponibles`}
              </span>
            </div>

            {/* CTA */}
            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className={clsx(
                'w-full py-4 rounded-2xl text-white font-bold text-base transition-all btn-ios shadow-sm',
                added
                  ? 'bg-green-500'
                  : 'bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {added ? '✓ Agregado al carrito' : outOfStock ? 'Sin stock' : 'Agregar al carrito'}
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={14} className="text-green-400" />
              Compra segura. Un repartidor lo lleva directamente a tu obra.
            </div>

            {product.category && (
              <div className="card-ios p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Tag size={14} /> Categoría
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{product.category}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <CartStickyBar />
      <BottomTabBar />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-16 glass border-b border-slate-100" />
      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        <div className="aspect-square bg-white rounded-2xl" />
        <div className="space-y-4">
          <div className="h-6 bg-slate-100 rounded-full w-1/3" />
          <div className="h-10 bg-slate-100 rounded-xl" />
          <div className="h-16 bg-slate-100 rounded-2xl" />
          <div className="h-14 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-16 glass border-b border-slate-100" />
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <span className="text-6xl">😕</span>
        <h2 className="text-xl font-bold text-slate-800 mt-4 mb-2">Producto no encontrado</h2>
        <p className="text-slate-500 mb-6">No pudimos cargar este producto.</p>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors btn-ios"
        >
          Volver al marketplace
        </Link>
      </div>
    </div>
  );
}
