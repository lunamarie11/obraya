'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Package, ChevronRight, ShoppingBag, ArrowRight, LogIn } from 'lucide-react';
import { api, formatARS } from '@/lib/api';
import { getStoredBuyer } from '@/lib/buyer-auth';
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { BottomTabBar } from '@/components/nav/BottomTabBar';
import type { Order } from '@obraya/shared';

async function fetchOrders(): Promise<Order[]> {
  return api.get('/buyer-orders').then((r) => r.data);
}

export default function OrdersPage() {
  const buyer = React.useMemo(() => getStoredBuyer(), []);

  const { data, isLoading } = useQuery({
    queryKey: ['buyer-orders'],
    queryFn: fetchOrders,
    enabled: !!buyer,
  });

  const orders = (data ?? []).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (!buyer) {
    return (
      <div className="min-h-screen bg-slate-50 pb-tabbar">
        <MarketplaceHeader showSearch={false} showBack backHref="/marketplace" title="Mis pedidos" />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <LoginPrompt />
        </main>
        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-tabbar">
      <MarketplaceHeader showSearch={false} showBack backHref="/marketplace" title="Mis pedidos" />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card-ios p-4 h-24 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>
      <BottomTabBar />
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const itemCount = order.items?.reduce((s, it) => s + it.quantity, 0) ?? 0;
  return (
    <Link href={`/my-orders/${order.id}`} className="card-ios p-4 flex items-center gap-4 hover:shadow-md transition-all btn-ios">
      <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
        <Package size={22} className="text-orange-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-bold text-slate-900 text-sm truncate">Pedido #{order.orderNumber}</p>
          <span className={`badge-${order.status.toLowerCase()}`}>{order.status}</span>
        </div>
        <p className="text-xs text-slate-400">
          {new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
          {' · '}
          {itemCount} ítem{itemCount !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-extrabold text-slate-900">{formatARS(order.totalAmount)}</p>
      </div>
      <ChevronRight size={18} className="text-slate-300 shrink-0" />
    </Link>
  );
}

function LoginPrompt() {
  return (
    <div className="text-center py-20">
      <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <LogIn size={40} className="text-orange-300" />
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Ingresá para ver tus pedidos</h1>
      <p className="text-slate-500 mb-8 max-w-xs mx-auto">
        Con tu cuenta podés hacer seguimiento de tus pedidos y repetirlos en un toque.
      </p>
      <Link
        href="/account"
        className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-colors btn-ios shadow-sm"
      >
        Ingresar <ArrowRight size={18} />
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <ShoppingBag size={40} className="text-orange-300" />
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Todavía no hiciste pedidos</h1>
      <p className="text-slate-500 mb-8 max-w-xs mx-auto">
        Tus pedidos aparecen acá apenas completás una compra desde este dispositivo.
      </p>
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-colors btn-ios shadow-sm"
      >
        Explorar marketplace <ArrowRight size={18} />
      </Link>
    </div>
  );
}
