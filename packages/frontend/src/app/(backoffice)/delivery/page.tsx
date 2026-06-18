'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, formatARS } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Truck, CheckCircle2, DollarSign, MapPin, Clock, History } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Comisión del repartidor: 8% del total del pedido
const DELIVERY_COMMISSION = 0.08;
const earning = (totalCentavos: number) => Math.round(Number(totalCentavos) * DELIVERY_COMMISSION);

export default function DeliveryPage() {
  const queryClient = useQueryClient();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['delivery-pending'],
    queryFn: () =>
      api.get('/orders', { params: { status: 'Despachado', limit: 50 } }).then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['delivery-history'],
    queryFn: () =>
      api.get('/orders', { params: { status: 'Entregado', limit: 100 } }).then((r) => r.data),
  });

  const markDelivered = useMutation({
    mutationFn: (orderId: string) =>
      api.put(`/orders/${orderId}/status`, { status: 'Entregado' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-pending'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-history'] });
      setConfirmingId(null);
    },
  });

  const pendingOrders: any[] = pendingData?.data ?? [];
  const historyOrders: any[] = historyData?.data ?? [];

  const totalPendingEarnings = pendingOrders.reduce(
    (sum, o) => sum + earning(o.totalAmount),
    0,
  );

  const todayStr = new Date().toDateString();
  const deliveredToday = historyOrders.filter(
    (o) => o.actualDeliveryDate && new Date(o.actualDeliveryDate).toDateString() === todayStr,
  );
  const todayEarnings = deliveredToday.reduce((sum, o) => sum + earning(o.totalAmount), 0);

  return (
    <div>
      <Header title="Mis Entregas" />
      <div className="p-6 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">Pendientes de entrega</span>
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                <Truck size={18} className="text-purple-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{pendingOrders.length}</p>
            <p className="text-xs text-slate-400 mt-1">pedidos listos para entregar</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">Ganancia estimada</span>
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                <DollarSign size={18} className="text-green-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{formatARS(totalPendingEarnings)}</p>
            <p className="text-xs text-slate-400 mt-1">comisión 8% sobre pedidos pendientes</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-500">Entregados hoy</span>
              <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                <CheckCircle2 size={18} className="text-orange-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{deliveredToday.length}</p>
            <p className="text-xs text-slate-400 mt-1">{formatARS(todayEarnings)} ganados hoy</p>
          </div>
        </div>

        {/* Pedidos entrantes */}
        <section>
          <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Truck size={16} className="text-purple-500" />
            Pedidos para entregar
            {pendingOrders.length > 0 && (
              <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {pendingOrders.length}
              </span>
            )}
          </h2>

          <div className="card overflow-hidden">
            {pendingLoading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Cargando pedidos...</div>
            ) : pendingOrders.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
                <p className="font-medium text-slate-600">¡Todo al día!</p>
                <p className="text-sm text-slate-400 mt-1">No hay pedidos pendientes de entrega.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">N° Pedido</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Comprador</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Dirección</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Total pedido</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Mi ganancia</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Entrega estimada</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-800">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700 font-medium">{order.buyerName ?? '—'}</p>
                        {order.buyerPhone && (
                          <p className="text-xs text-slate-400">{order.buyerPhone}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {order.deliveryAddress ? (
                          <div className="flex items-start gap-1">
                            <MapPin size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-slate-600 leading-tight">
                              {order.deliveryAddress.street}, {order.deliveryAddress.city}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {formatARS(Number(order.totalAmount))}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-green-700 font-semibold">
                          {formatARS(earning(order.totalAmount))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {order.scheduledDeliveryDate
                          ? format(new Date(order.scheduledDeliveryDate), "d MMM, HH:mm", { locale: es })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {confirmingId === order.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => markDelivered.mutate(order.id)}
                              disabled={markDelivered.isPending}
                              className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1.5 rounded font-medium transition-colors disabled:opacity-60"
                            >
                              {markDelivered.isPending ? '...' : 'Confirmar'}
                            </button>
                            <button
                              onClick={() => setConfirmingId(null)}
                              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmingId(order.id)}
                            className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-600 font-medium px-3 py-1.5 rounded-lg transition-colors border border-orange-200"
                          >
                            Marcar entregado
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Historial */}
        <section>
          <h2 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <History size={16} className="text-slate-400" />
            Historial de entregas
            {historyOrders.length > 0 && (
              <span className="text-xs text-slate-400 font-normal">
                — {historyOrders.length} en total
              </span>
            )}
          </h2>

          <div className="card overflow-hidden">
            {historyLoading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Cargando historial...</div>
            ) : historyOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Aún no hay entregas completadas.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">N° Pedido</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Comprador</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Dirección</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Total pedido</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Ganancia cobrada</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Fecha entrega</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyOrders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-800">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{order.buyerName ?? '—'}</td>
                      <td className="px-4 py-3">
                        {order.deliveryAddress ? (
                          <div className="flex items-start gap-1">
                            <MapPin size={13} className="text-slate-400 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-slate-600 leading-tight">
                              {order.deliveryAddress.street}, {order.deliveryAddress.city}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {formatARS(Number(order.totalAmount))}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-green-700 font-semibold">
                          {formatARS(earning(order.totalAmount))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {order.actualDeliveryDate
                          ? format(new Date(order.actualDeliveryDate), "d MMM yyyy, HH:mm", { locale: es })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge-entregado">Entregado</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
