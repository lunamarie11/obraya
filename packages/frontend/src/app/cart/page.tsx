'use client';

import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import { formatARS } from '@/lib/api';
import { removeFromCart, updateCartItemQuantity, clearCart } from '@/lib/cart';
import type { CartItem } from '@/lib/cart';
import { useCart } from '@/hooks/useCart';
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { BottomTabBar } from '@/components/nav/BottomTabBar';

export default function CartPage() {
  const { cart, count, total } = useCart();

  if (!cart.length) {
    return (
      <div className="min-h-screen bg-slate-50 pb-tabbar">
        <MarketplaceHeader showSearch={false} showBack backHref="/marketplace" />
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={40} className="text-orange-300" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Tu carrito está vacío</h1>
          <p className="text-slate-500 mb-8">Agregá materiales desde el marketplace para empezar tu compra.</p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-colors btn-ios shadow-sm"
          >
            Explorar marketplace <ArrowRight size={18} />
          </Link>
        </div>
        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-tabbar">
      <MarketplaceHeader showSearch={false} showBack backHref="/marketplace" title="Carrito" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-lg text-slate-900">{count} ítem{count !== 1 ? 's' : ''}</h2>
              <button
                onClick={clearCart}
                className="text-sm text-slate-400 hover:text-red-500 transition-colors font-medium"
              >
                Vaciar carrito
              </button>
            </div>

            {cart.map((item) => (
              <CartItem
                key={`${item.productId}-${item.variantId ?? 'base'}`}
                item={item}
                onQuantityChange={(qty) => updateCartItemQuantity(item.productId, item.variantId ?? null, qty)}
                onRemove={() => removeFromCart(item.productId, item.variantId ?? undefined)}
              />
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="card-ios p-5 sticky top-24">
              <h2 className="font-bold text-lg text-slate-900 mb-4">Resumen</h2>

              <div className="space-y-2 mb-4">
                {cart.map((item) => (
                  <div key={`${item.productId}-${item.variantId ?? 'base'}`} className="flex justify-between text-sm text-slate-600">
                    <span className="truncate mr-2">{item.name} × {item.quantity}</span>
                    <span className="font-medium shrink-0">
                      {item.price ? formatARS(item.price * item.quantity) : '—'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4 mb-5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Total</span>
                  <span className="text-2xl font-extrabold text-slate-900">{formatARS(total)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="flex items-center justify-center gap-2 w-full py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-colors btn-ios shadow-sm"
              >
                Ir al checkout <ArrowRight size={18} />
              </Link>

              <Link
                href="/marketplace"
                className="flex items-center justify-center w-full mt-3 py-3 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
              >
                Seguir comprando
              </Link>
            </div>
          </div>
        </div>
      </main>
      <BottomTabBar />
    </div>
  );
}

function CartItem({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  onQuantityChange: (qty: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="card-ios p-4 flex items-center gap-4">
      {/* Placeholder image */}
      <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
        <Package size={24} className="text-slate-300" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 leading-snug">{item.name}</h3>
        {item.variantId && (
          <p className="text-xs text-slate-400 mt-0.5">Variante seleccionada</p>
        )}
        <p className="text-sm font-bold text-slate-900 mt-1">
          {item.price ? formatARS(item.price) : '—'}
        </p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 shrink-0">
        <button
          onClick={() => onQuantityChange(item.quantity - 1)}
          className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <Minus size={14} />
        </button>
        <span className="w-8 text-center text-sm font-bold text-slate-900">{item.quantity}</span>
        <button
          onClick={() => onQuantityChange(item.quantity + 1)}
          className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors shrink-0"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
