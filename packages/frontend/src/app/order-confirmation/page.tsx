'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQueries } from '@tanstack/react-query';
import { CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { OrderStatusStepper } from '@/components/order/OrderStatusStepper';
import type { Order } from '@obraya/shared';

async function fetchOrder(orderId: string): Promise<Order> {
  return api.get(`/buyer-orders/${orderId}`).then((r) => r.data);
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  // Un checkout puede generar varios pedidos (uno por fabricante) — ver ADR-006.
  const orderIds = (searchParams?.get('orderIds') ?? searchParams?.get('orderId') ?? '')
    .split(',')
    .filter(Boolean);

  const results = useQueries({
    queries: orderIds.map((id) => ({
      queryKey: ['order', id],
      queryFn: () => fetchOrder(id),
    })),
  });

  const orders = results.map((r) => r.data).filter(Boolean) as Order[];
  const isLoading = results.some((r) => r.isLoading);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div className="relative mx-auto mb-8 w-28 h-28">
          <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-40" />
          <div className="relative w-28 h-28 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle2 size={52} className="text-white" strokeWidth={2.5} />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
          {orderIds.length > 1 ? '¡Pedidos confirmados!' : '¡Pedido confirmado!'}
        </h1>
        {orders.length > 0 && (
          <p className="text-sm font-semibold text-slate-400 mb-3">
            {orders.map((o) => `#${o.orderNumber}`).join(' · ')}
          </p>
        )}
        <p className="text-slate-500 text-base leading-relaxed mb-8">
          {orderIds.length > 1
            ? 'Tus pedidos fueron registrados. Cada fabricante prepara el suyo y te lo lleva directo a tu obra.'
            : 'Tu pedido fue registrado. Un repartidor lo va a preparar y te va a llevar los materiales directo a tu obra.'}
        </p>

        {orderIds.length > 0 && (
          <div className="space-y-4 mb-8">
            {isLoading ? (
              <div className="card-ios p-5 text-left">
                <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            ) : orders.length > 0 ? (
              orders.map((order) => (
                <div key={order.id} className="card-ios p-5 text-left">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
                    Seguimiento · Pedido #{order.orderNumber}
                  </p>
                  <OrderStatusStepper status={order.status} />
                </div>
              ))
            ) : (
              <div className="card-ios p-5 text-left">
                <p className="text-sm text-slate-400">No pudimos cargar el estado del pedido.</p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href="/marketplace"
            className="flex items-center justify-center gap-2 w-full py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-colors btn-ios shadow-sm"
          >
            <ShoppingBag size={18} /> Seguir comprando
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-4 bg-white text-slate-600 rounded-2xl font-semibold hover:bg-slate-50 transition-colors border border-slate-200 btn-ios"
          >
            Volver al inicio <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
