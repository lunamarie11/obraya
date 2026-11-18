'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, ArrowRight, LogIn, MapPin, CheckCircle2 } from 'lucide-react';
import { api, formatARS } from '@/lib/api';
import { getStoredDelivery, deliveryLogout } from '@/lib/delivery-auth';
import type { Order } from '@obraya/shared';

async function fetchAvailable(): Promise<Order[]> {
  return api.get('/delivery-orders/available').then((r) => r.data);
}

async function fetchMine(): Promise<Order[]> {
  return api.get('/delivery-orders/mine').then((r) => r.data);
}

export default function DeliveryOrdersPage() {
  const delivery = React.useMemo(() => getStoredDelivery(), []);
  const [tab, setTab] = useState<'available' | 'mine'>('available');
  const queryClient = useQueryClient();

  const availableQuery = useQuery({
    queryKey: ['delivery-orders-available'],
    queryFn: fetchAvailable,
    enabled: !!delivery && tab === 'available',
  });

  const mineQuery = useQuery({
    queryKey: ['delivery-orders-mine'],
    queryFn: fetchMine,
    enabled: !!delivery && tab === 'mine',
  });

  const claimMutation = useMutation({
    mutationFn: (id: string) => api.post(`/delivery-orders/${id}/claim`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders-available'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-orders-mine'] });
      setTab('mine');
    },
  });

  const deliveredMutation = useMutation({
    mutationFn: (id: string) => api.put(`/delivery-orders/${id}/delivered`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['delivery-orders-mine'] }),
  });

  if (!delivery) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <LoginPrompt />
        </main>
      </div>
    );
  }

  const query = tab === 'available' ? availableQuery : mineQuery;
  const orders = query.data ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header delivery={delivery} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-2 mb-5">
          <TabButton active={tab === 'available'} onClick={() => setTab('available')}>
            Disponibles
          </TabButton>
          <TabButton active={tab === 'mine'} onClick={() => setTab('mine')}>
            Mis pedidos
          </TabButton>
        </div>

        {query.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-4 h-24 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                tab={tab}
                onClaim={() => claimMutation.mutate(order.id)}
                onDelivered={() => deliveredMutation.mutate(order.id)}
                claiming={claimMutation.isPending}
                delivering={deliveredMutation.isPending}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Header({ delivery }: { delivery?: { firstName: string } | null }) {
  return (
    <header className="bg-white border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
          <Package size={16} className="text-white" />
        </div>
        <span className="font-extrabold text-slate-900">ObraYa Delivery</span>
      </div>
      {delivery && (
        <button
          onClick={() => {
            deliveryLogout();
            window.location.href = '/delivery/login';
          }}
          className="text-sm font-semibold text-slate-400 hover:text-slate-600"
        >
          Salir
        </button>
      )}
    </header>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
        active ? 'bg-orange-500 text-white' : 'bg-white text-slate-500'
      }`}
    >
      {children}
    </button>
  );
}

function OrderRow({
  order,
  tab,
  onClaim,
  onDelivered,
  claiming,
  delivering,
}: {
  order: Order;
  tab: 'available' | 'mine';
  onClaim: () => void;
  onDelivered: () => void;
  claiming: boolean;
  delivering: boolean;
}) {
  const itemCount = order.items?.reduce((s, it) => s + it.quantity, 0) ?? 0;
  const address = order.deliveryAddress;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <p className="font-bold text-slate-900 text-sm">Pedido #{order.orderNumber}</p>
        <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
          {order.status}
        </span>
      </div>
      {address && (
        <p className="text-xs text-slate-500 flex items-start gap-1.5 mb-2">
          <MapPin size={14} className="shrink-0 mt-0.5" />
          {address.street}, {address.city}
        </p>
      )}
      <p className="text-xs text-slate-400 mb-3">
        {itemCount} ítem{itemCount !== 1 ? 's' : ''} · {formatARS(order.totalAmount)}
      </p>

      {tab === 'available' ? (
        <button
          onClick={onClaim}
          disabled={claiming}
          className="w-full py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 disabled:opacity-60 transition-colors"
        >
          {claiming ? 'Reclamando...' : 'Reclamar pedido'}
        </button>
      ) : order.status !== 'Entregado' ? (
        <button
          onClick={onDelivered}
          disabled={delivering}
          className="w-full py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={16} />
          {delivering ? 'Marcando...' : 'Marcar como entregado'}
        </button>
      ) : null}
    </div>
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
        Ingresá con tu cuenta de delivery para ver pedidos disponibles y gestionar tus entregas.
      </p>
      <Link
        href="/delivery/login"
        className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-colors shadow-sm"
      >
        Ingresar <ArrowRight size={18} />
      </Link>
    </div>
  );
}

function EmptyState({ tab }: { tab: 'available' | 'mine' }) {
  return (
    <div className="text-center py-20">
      <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Package size={40} className="text-orange-300" />
      </div>
      <h1 className="text-xl font-extrabold text-slate-900 mb-2">
        {tab === 'available' ? 'No hay pedidos disponibles' : 'Todavía no reclamaste pedidos'}
      </h1>
      <p className="text-slate-500 max-w-xs mx-auto">
        {tab === 'available'
          ? 'Volvé a revisar en un rato, aparecen nuevos pedidos todo el tiempo.'
          : 'Reclamá un pedido de la pestaña "Disponibles" para empezar.'}
      </p>
    </div>
  );
}
