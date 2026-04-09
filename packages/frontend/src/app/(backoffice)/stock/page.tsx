'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { AlertTriangle, Package } from 'lucide-react';
import { clsx } from 'clsx';

export default function StockPage() {
  const { data: stocks, isLoading } = useQuery({
    queryKey: ['stock'],
    queryFn: () => api.get('/stock').then((r) => r.data),
  });

  const lowStock = stocks?.filter((s: any) => s.quantity <= s.minimumAlert) ?? [];

  return (
    <div>
      <Header title="Stock" />
      <div className="p-6 space-y-4">

        {lowStock.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              <span className="font-semibold">{lowStock.length} producto{lowStock.length > 1 ? 's' : ''}</span> con stock bajo el mínimo configurado.
            </p>
          </div>
        )}

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
                : stocks?.map((s: any) => {
                    const available = s.quantity - s.reservedQuantity;
                    const isLow = available <= s.minimumAlert;
                    return (
                      <tr key={s.id} className={clsx('hover:bg-slate-50', isLow && 'bg-amber-50/50')}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-700">{s.product?.name}</p>
                          {s.product?.sku && <p className="text-xs text-slate-400 font-mono">{s.product.sku}</p>}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{s.warehouseName}</td>
                        <td className={clsx('px-4 py-3 text-right font-semibold', isLow ? 'text-red-600' : 'text-green-700')}>
                          {available}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500">{s.reservedQuantity}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-800">{s.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-400">{s.minimumAlert}</td>
                        <td className="px-4 py-3">
                          {isLow && <AlertTriangle size={14} className="text-amber-500" />}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>

          {!isLoading && stocks?.length === 0 && (
            <div className="p-12 flex flex-col items-center text-center">
              <Package size={36} className="text-slate-300 mb-3" />
              <p className="text-slate-500">No hay stock registrado aún</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
