'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Package, RotateCcw, ShoppingBag } from 'lucide-react';
import { api, formatARS } from '@/lib/api';
import { addToCart } from '@/lib/cart';
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { BottomTabBar } from '@/components/nav/BottomTabBar';
import { OrderStatusStepper } from '@/components/order/OrderStatusStepper';
import type { Order } from '@obraya/shared';

async function fetchOrder(orderId: string): Promise<Order> {
  return api.get(`/buyer-orders/${orderId}`).then((r) => r.data);
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id),
  });

  function handleReorder() {
    if (!order) return;
    order.items.forEach((item) => {
      addToCart({
        productId: item.productId,
        variantId: item.variantId ?? null,
        companyId: order.companyId,
        name: item.productName ?? 'Producto',
        price: item.unitPrice,
        quantity: item.quantity,
      });
    });
    router.push('/cart');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-tabbar">
        <MarketplaceHeader showSearch={false} showBack backHref="/my-orders" title="Pedido" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <div className="card-ios h-32 animate-pulse bg-slate-100" />
          <div className="card-ios h-48 animate-pulse bg-slate-100" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 pb-tabbar">
        <MarketplaceHeader showSearch={false} showBack backHref="/my-orders" title="Pedido" />
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <Package size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">No pudimos cargar este pedido</h2>
          <p className="text-slate-500">Puede que ya no exista o que necesites iniciar sesión de nuevo.</p>
        </div>
        <BottomTabBar />
      </div>
    );
  }

  const itemCount = order.items?.reduce((s, it) => s + it.quantity, 0) ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-tabbar">
      <MarketplaceHeader showSearch={false} showBack backHref="/my-orders" title={`Pedido #${order.orderNumber}`} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Tracking */}
        <div className="card-ios p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Seguimiento</p>
            <span className={`badge-${order.status.toLowerCase()}`}>{order.status}</span>
          </div>
          <OrderStatusStepper status={order.status} />
          {order.status === 'Cancelado' && order.rejectionReason && (
            <p className="text-sm text-red-500 mt-4">Motivo: {order.rejectionReason}</p>
          )}
        </div>

        {/* Delivery address */}
        {order.deliveryAddress && (
          <div className="card-ios p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <MapPin size={14} /> Entrega en
            </p>
            <p className="font-semibold text-slate-800">{order.deliveryAddress.street}</p>
            <p className="text-sm text-slate-500">
              {[order.deliveryAddress.city, order.deliveryAddress.province, order.deliveryAddress.postalCode]
                .filter(Boolean)
                .join(', ')}
            </p>
            {order.deliveryAddress.notes && <p className="text-sm text-slate-400 mt-1">{order.deliveryAddress.notes}</p>}
          </div>
        )}

        {/* Items */}
        <div className="card-ios p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            {itemCount} ítem{itemCount !== 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                <span className="text-sm text-slate-700 flex-1 line-clamp-2">
                  {item.productName ?? 'Producto'} × {item.quantity}
                </span>
                <span className="text-sm font-bold text-slate-900 shrink-0">{formatARS(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 mt-4 pt-4 flex items-center justify-between">
            <span className="font-semibold text-slate-800">Total</span>
            <span className="text-xl font-extrabold text-slate-900">{formatARS(order.totalAmount)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleReorder}
            className="flex items-center justify-center gap-2 w-full py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-colors btn-ios shadow-sm"
          >
            <RotateCcw size={18} /> Repetir pedido
          </button>
          <a
            href="/marketplace"
            className="flex items-center justify-center gap-2 w-full py-3 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
          >
            <ShoppingBag size={16} /> Seguir comprando
          </a>
        </div>
      </main>
      <BottomTabBar />
    </div>
  );
}
