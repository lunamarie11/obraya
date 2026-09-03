'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Download, FileSpreadsheet } from 'lucide-react';

export default function ReportsPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-01-01`;
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);

  const downloadSales = () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3010/api/v1'}/reports/sales?from=${from}&to=${to}`;
    const a = document.createElement('a');
    a.href = url;
    a.click();
  };

  const downloadStock = () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3010/api/v1'}/reports/stock`;
    const a = document.createElement('a');
    a.href = url;
    a.click();
  };

  return (
    <div>
      <Header title="Reportes" />
      <div className="p-6 space-y-5 max-w-2xl">

        {/* Reporte de ventas */}
        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet size={20} className="text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-slate-900 mb-1">Reporte de ventas</h2>
              <p className="text-sm text-slate-500">
                Exportá todas las ventas del período seleccionado con detalle por producto. Compatible con Excel.
              </p>
              <div className="flex gap-3 mt-4">
                <div>
                  <label className="label">Desde</label>
                  <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div>
                  <label className="label">Hasta</label>
                  <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
              </div>
              <button onClick={downloadSales} className="btn-primary mt-4 flex items-center gap-2 text-sm">
                <Download size={15} /> Descargar CSV
              </button>
            </div>
          </div>
        </div>

        {/* Reporte de stock */}
        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet size={20} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-slate-900 mb-1">Reporte de stock</h2>
              <p className="text-sm text-slate-500">
                Stock actual por producto y depósito. Incluye cantidades disponibles, reservadas y alertas de stock mínimo.
              </p>
              <button onClick={downloadStock} className="btn-primary mt-4 flex items-center gap-2 text-sm">
                <Download size={15} /> Descargar CSV
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
