'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { AlertTriangle, Package, Pencil, Check, X, History, Upload, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function StockPage() {
  const qc = useQueryClient();
  const csvRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editMin, setEditMin] = useState('');
  const [editWh, setEditWh] = useState('');
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);

  const { data: stocks = [], isLoading } = useQuery({
    queryKey: ['stock'],
    queryFn: () => api.get('/stock').then((r) => r.data),
  });

  const { data: movements = [], isFetching: movFetching } = useQuery({
    queryKey: ['stock-movements', historyId],
    queryFn: () => api.get(`/stock/${historyId}/movements`).then((r) => r.data),
    enabled: !!historyId,
  });

  const updateStock = useMutation({
    mutationFn: ({ productId, quantity, minimumAlert, warehouseName }: any) =>
      api.put(`/stock/${productId}`, { quantity, minimumAlert, warehouseName }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stock'] });
      setEditingId(null);
    },
  });

  const startEdit = (s: any) => {
    setEditingId(s.productId);
    setEditQty(String(s.quantity));
    setEditMin(String(s.minimumAlert));
    setEditWh(s.warehouseName ?? '');
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post('/stock/bulk-update/csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      qc.invalidateQueries({ queryKey: ['stock'] });
    } finally {
      setCsvUploading(false);
      e.target.value = '';
    }
  };

  const lowStock = stocks.filter((s: any) => (s.quantity - s.reservedQuantity) <= s.minimumAlert);

  return (
    <div>
      <Header title="Stock" />
      <div className="p-6 space-y-4">

        {lowStock.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              <span className="font-semibold">{lowStock.length} producto{lowStock.length > 1 ? 's' : ''}</span>{' '}
              con stock bajo el mínimo configurado.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <label className={clsx('btn-secondary text-sm flex items-center gap-2 cursor-pointer', csvUploading && 'opacity-60 pointer-events-none')}>
            {csvUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {csvUploading ? 'Importando...' : 'Importar CSV'}
            <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
          </label>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Producto</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Depósito</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Disponible</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Reservado</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Total</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Mínimo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                : stocks.map((s: any) => {
                    const available = s.quantity - s.reservedQuantity;
                    const isLow = available <= s.minimumAlert;
                    const isEditing = editingId === s.productId;

                    return (
                      <tr key={s.id} className={clsx('hover:bg-slate-50', isLow && 'bg-amber-50/40')}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-700">{s.product?.name}</p>
                          {s.product?.sku && <p className="text-xs text-slate-400 font-mono">{s.product.sku}</p>}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              className="input text-sm w-32"
                              value={editWh}
                              onChange={(e) => setEditWh(e.target.value)}
                              placeholder="Depósito"
                            />
                          ) : (
                            <span className="text-slate-500">{s.warehouseName ?? '—'}</span>
                          )}
                        </td>
                        <td className={clsx('px-4 py-3 text-right font-semibold', isLow ? 'text-red-600' : 'text-green-700')}>
                          {available}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">{s.reservedQuantity}</td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <input
                              type="number" min="0"
                              className="input text-sm w-20 text-right"
                              value={editQty}
                              onChange={(e) => setEditQty(e.target.value)}
                            />
                          ) : (
                            <span className="font-medium text-slate-800">{s.quantity}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <input
                              type="number" min="0"
                              className="input text-sm w-20 text-right"
                              value={editMin}
                              onChange={(e) => setEditMin(e.target.value)}
                            />
                          ) : (
                            <span className="text-slate-400">{s.minimumAlert}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => updateStock.mutate({
                                    productId: s.productId,
                                    quantity: Number(editQty),
                                    minimumAlert: Number(editMin),
                                    warehouseName: editWh || undefined,
                                  })}
                                  disabled={updateStock.isPending}
                                  className="p-1.5 rounded bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                                >
                                  {updateStock.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                                </button>
                                <button onClick={() => setEditingId(null)} className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-500">
                                  <X size={13} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(s)}
                                  className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                                  title="Editar stock"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() => setHistoryId(historyId === s.productId ? null : s.productId)}
                                  className={clsx('p-1.5 rounded transition-colors', historyId === s.productId ? 'bg-orange-100 text-orange-500' : 'bg-slate-100 hover:bg-slate-200 text-slate-500')}
                                  title="Ver movimientos"
                                >
                                  <History size={13} />
                                </button>
                                {isLow && <AlertTriangle size={14} className="text-amber-500 ml-1" />}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>

          {!isLoading && stocks.length === 0 && (
            <div className="p-12 flex flex-col items-center text-center">
              <Package size={36} className="text-slate-300 mb-3" />
              <p className="text-slate-500">No hay stock registrado aún</p>
            </div>
          )}
        </div>

        {/* Historial de movimientos inline */}
        {historyId && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-medium text-slate-700 text-sm flex items-center gap-2">
                <History size={14} className="text-slate-400" />
                Movimientos de stock
              </h3>
              <button onClick={() => setHistoryId(null)} className="text-slate-400 hover:text-slate-600">
                <X size={15} />
              </button>
            </div>
            {movFetching ? (
              <div className="p-4 text-center text-slate-400 text-sm">Cargando...</div>
            ) : movements.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">Sin movimientos registrados.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Tipo</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-slate-500">Cantidad</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">Notas</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-slate-500">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {movements.map((m: any) => (
                    <tr key={m.id}>
                      <td className="px-4 py-2">
                        <span className={clsx(
                          'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                          m.type === 'entrada' ? 'bg-green-100 text-green-700' :
                          m.type === 'salida' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600',
                        )}>
                          {m.type}
                        </span>
                      </td>
                      <td className={clsx('px-4 py-2 text-right font-medium', m.quantity > 0 ? 'text-green-600' : 'text-red-500')}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </td>
                      <td className="px-4 py-2 text-slate-400 text-xs">{m.notes ?? '—'}</td>
                      <td className="px-4 py-2 text-right text-slate-400 text-xs">
                        {format(new Date(m.createdAt), "d MMM yyyy HH:mm", { locale: es })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
