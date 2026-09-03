'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { Plus, Store, Heart } from 'lucide-react';
import { formatARS } from '@/lib/api';
import { useFavorites } from '@/hooks/useFavorites';
import { CATEGORIES, CATEGORY_GRADIENTS } from './categories';

export interface ProductCardData {
  id: string;
  companyId: string;
  name: string;
  category?: string;
  images?: string[];
  companyName?: string;
  price?: { basePrice: number; finalPrice: number; discountPercent: number };
}

interface Props {
  product: ProductCardData;
  added: boolean;
  onQuickAdd: (e: React.MouseEvent, product: ProductCardData) => void;
  showStore?: boolean;
}

export function ProductCard({ product, added, onQuickAdd, showStore = true }: Props) {
  const router = useRouter();
  const { buyer, isFavorite, toggle } = useFavorites();
  const price = product.price?.finalPrice ?? product.price?.basePrice;
  const gradient = CATEGORY_GRADIENTS[product.category ?? ''] ?? CATEGORY_GRADIENTS.default;
  const favorited = isFavorite('product', product.id);

  function handleToggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!buyer) {
      router.push('/account');
      return;
    }
    toggle('product', product.id);
  }

  return (
    <Link href={`/marketplace/products/${product.id}`} className="group block">
      <div className="card-ios overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        <div className={`relative h-44 bg-gradient-to-br ${gradient} overflow-hidden`}>
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-5xl opacity-40">
                {CATEGORIES.find((c) => c.key === product.category)?.emoji ?? '📦'}
              </span>
            </div>
          )}

          <button
            onClick={handleToggleFavorite}
            className={clsx(
              'absolute top-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 btn-ios',
              favorited ? 'bg-white text-red-500' : 'bg-white/90 text-slate-400 hover:text-red-500',
            )}
          >
            <Heart size={15} className={favorited ? 'fill-red-500' : ''} />
          </button>

          <button
            onClick={(e) => onQuickAdd(e, product)}
            className={clsx(
              'absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 btn-ios',
              added
                ? 'bg-green-500 text-white scale-110'
                : 'bg-white text-orange-500 hover:bg-orange-500 hover:text-white opacity-0 group-hover:opacity-100',
            )}
          >
            {added ? '✓' : <Plus size={18} />}
          </button>
        </div>

        <div className="p-3">
          {showStore && product.companyName && (
            <div className="flex items-center gap-1 mb-1">
              <Store size={11} className="text-slate-400 shrink-0" />
              <span className="text-[11px] text-slate-400 truncate font-medium">{product.companyName}</span>
            </div>
          )}
          <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 leading-snug mb-2">{product.name}</h3>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-slate-900">
              {price ? formatARS(price) : '—'}
            </span>
            {(product.price?.discountPercent ?? 0) > 0 && (
              <span className="text-[11px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                -{product.price?.discountPercent}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card-ios overflow-hidden animate-pulse">
      <div className="h-44 bg-slate-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-slate-100 rounded-full w-2/3" />
        <div className="h-4 bg-slate-100 rounded-full" />
        <div className="h-4 bg-slate-100 rounded-full w-3/4" />
        <div className="h-5 bg-slate-100 rounded-full w-1/2 mt-3" />
      </div>
    </div>
  );
}
