'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, formatARS } from '@/lib/api';
import { Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';

const STATUSES = ['', 'Nuevo', 'Aceptado', 'Preparacion', 'Despachado', 'Entregado', 'Cancelado'];
const STATUS_BADGE: Record<string, string> = {
  Nuevo: 'bg-blue-100 text-blue-700',
  Aceptado: 'bg-indigo-100 text-indigo-700',
  Preparacion: 'bg-yellow-100 text-yellow-700',
  Despachado: 'bg-purple-100 text-purple-700',
  Entregado: 'bg-green-100 text-green-700',
  Cancelado: 'bg-red-100 text-red-700',
};

export default function AdminOrdersPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, search, page],
    queryFn: () =>
      api.get('/admin/orders', {
        params: { status: status || undefined, search: search || undefined, page, limit: 20 },
      }).then((r) => r.data),
  });

  const deleteOrder = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/orders/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      setDeleteId(null);
    },
  });

  const orders: any[] = data?.data ?? [];

  return (
    <div>
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-6 sticky top-0 z-10">
        <h1 className="text-base font-semibold text-white">Pedidos</h1>
        {data?.total != null && <span className="ml-3 text-xs text-slate-500">{data.total} en total</span>}
      </header>

      <div className="p-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Buscar por N° pedido, comprador o empresa..."
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
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  status === s
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white',
                )}
              >
                {s || 'Todos'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Cargando pedidos...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No se encontraron pedidos.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700">
                <tr>
                  {['N° Pedido', 'Empresa', 'Comprador', 'Estado', 'Total', 'Fecha', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-white text-xs font-medium">{o.orderNumber}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{o.companyName}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{o.buyerName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', STATUS_BADGE[o.status] ?? 'bg-slate-100 text-slate-600')}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">{formatARS(Number(o.totalAmount))}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {format(new Date(o.createdAt), 'd MMM yyyy', { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteId(o.id)}
                        className="p-1.5 rounded bg-slate-700 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
              <span className="text-xs text-slate-500">{data.total} pedidos</span>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg disabled:opacity-40">
                  Anterior
                </button>
                <span className="text-xs text-slate-400 py-1.5 px-2">{page} / {data.totalPages}</span>
                <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg disabled:opacity-40">
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-semibold text-white mb-2">Eliminar pedido</h3>
            <p className="text-sm text-slate-400 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium py-2 rounded-lg">Cancelar</button>
              <button onClick={() => deleteOrder.mutate(deleteId!)} disabled={deleteOrder.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-60">
                {deleteOrder.isPending ? '...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
