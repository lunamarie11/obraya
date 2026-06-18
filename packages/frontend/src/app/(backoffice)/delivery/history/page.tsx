'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api, formatARS } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { History, MapPin, Search } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const DELIVERY_COMMISSION = 0.08;
const earning = (totalCentavos: number) => Math.round(Number(totalCentavos) * DELIVERY_COMMISSION);

export default function DeliveryHistoryPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['delivery-history-full', search, page],
    queryFn: () =>
      api.get('/orders', {
        params: {
          status: 'Entregado',
          search: search || undefined,
          page,
          limit: 20,
        },
      }).then((r) => r.data),
  });

  const orders: any[] = data?.data ?? [];

  const totalEarnings = orders.reduce((sum, o) => sum + earning(o.totalAmount), 0);

  return (
    <div>
      <Header title="Historial de Entregas" />
      <div className="p-6 space-y-4">

        {/* Resumen */}
        <div className="card p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <History size={16} className="text-slate-400" />
            <span className="text-sm font-medium">
              {data?.total ?? 0} entregas completadas en total
            </span>
          </div>
          <div className="text-sm font-semibold text-green-700">
            {formatARS(totalEarnings)} en esta página
          </div>
        </div>

        {/* Buscador */}
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por número o comprador..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Tabla */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Cargando historial...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No se encontraron entregas.
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
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Fecha entrega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order: any) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Paginación */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
              <span className="text-sm text-slate-500">{data.total} entregas</span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="btn-secondary text-sm py-1 px-3 disabled:opacity-40"
                >
                  Anterior
                </button>
                <span className="text-sm text-slate-600 py-1 px-2">
                  {page} / {data.totalPages}
                </span>
                <button
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="btn-secondary text-sm py-1 px-3 disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
