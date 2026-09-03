'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { api, formatARS } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Search, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUSES = ['', 'Nuevo', 'Aceptado', 'Preparacion', 'Despachado', 'Entregado', 'Cancelado'];

export default function OrdersPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', status, search, page],
    queryFn: () =>
      api.get('/orders', { params: { status: status || undefined, search: search || undefined, page, limit: 20 } })
        .then((r) => r.data),
  });

  return (
    <div>
      <Header title="Pedidos" />
      <div className="p-6 space-y-4">

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="input pl-9"
              placeholder="Buscar por número o comprador..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border',
                  status === s
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                {s || 'Todos'}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">N° Pedido</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Comprador</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Total</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-200 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.data?.map((order: any) => (
                    <tr key={order.id} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-slate-600">{order.buyerName ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge-${order.status.toLowerCase()}`}>{order.status}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatARS(order.totalAmount)}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {format(new Date(order.createdAt), 'd MMM yyyy', { locale: es })}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/orders/${order.id}`} className="text-orange-500 hover:text-orange-600 transition-colors">
                          <ChevronRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
              <span className="text-sm text-slate-500">{data.total} pedidos</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary text-sm py-1 px-3 disabled:opacity-40">
                  Anterior
                </button>
                <span className="text-sm text-slate-400 py-1 px-2">{page} / {data.totalPages}</span>
                <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} className="btn-secondary text-sm py-1 px-3 disabled:opacity-40">
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
