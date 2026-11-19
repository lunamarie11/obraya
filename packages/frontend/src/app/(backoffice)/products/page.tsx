'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Plus, Search, Package, Pencil, EyeOff, Upload, Loader2, AlertTriangle, CheckCircle2, X, Download } from 'lucide-react';
import { downloadCsvTemplate, PRODUCTS_TEMPLATE, apiErrorMessage } from '@/lib/csv-template';
import { clsx } from 'clsx';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const importRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, page],
    queryFn: () =>
      api.get('/products', { params: { search: search || undefined, page, limit: 20 } })
        .then((r) => r.data),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setImportError(null);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post('/products/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImportResult(data);
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    } catch (err) {
      setImportError(apiErrorMessage(err, 'No se pudo importar el archivo. Revisá que tenga el formato de la plantilla.'));
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <Header title="Productos" actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadCsvTemplate(PRODUCTS_TEMPLATE.filename, PRODUCTS_TEMPLATE.headers, PRODUCTS_TEMPLATE.rows)}
            className="text-sm text-slate-600 hover:text-orange-600 flex items-center gap-1.5 px-2"
            title="Columnas: Nombre (obligatoria), SKU, Descripción, Categoría, Marca, Unidad de medida, Precio (con IVA), Stock"
          >
            <Download size={14} /> Plantilla
          </button>
          <label className={clsx('btn-secondary text-sm flex items-center gap-2 cursor-pointer', importing && 'opacity-60 pointer-events-none')}>
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {importing ? 'Importando...' : 'Importar CSV/Excel'}
            <input ref={importRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImport} />
          </label>
          <Link href="/products/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Nuevo producto
          </Link>
        </div>
      } />
      <div className="p-6 space-y-4">

        {importError && (
          <div className="rounded-2xl p-4 flex items-start gap-3 border bg-red-50 border-red-200">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 flex-1">{importError}</p>
            <button onClick={() => setImportError(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
              <X size={15} />
            </button>
          </div>
        )}

        {importResult && (
          <div className={clsx(
            'rounded-2xl p-4 flex items-start gap-3 border',
            importResult.errors.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200',
          )}>
            {importResult.errors.length > 0
              ? <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
              : <CheckCircle2 size={18} className="text-green-500 flex-shrink-0 mt-0.5" />}
            <div className="text-sm flex-1">
              <p className={importResult.errors.length > 0 ? 'text-amber-700' : 'text-green-700'}>
                <span className="font-semibold">{importResult.created}</span> creados,{' '}
                <span className="font-semibold">{importResult.updated}</span> actualizados
                {importResult.errors.length > 0 && (
                  <>, <span className="font-semibold">{importResult.errors.length}</span> con error{importResult.errors.length > 1 ? 'es' : ''}</>
                )}
              </p>
              {importResult.errors.length > 0 && (
                <ul className="mt-1.5 text-xs text-amber-600 space-y-0.5 max-h-32 overflow-y-auto">
                  {importResult.errors.map((err, i) => (
                    <li key={i}>Fila {err.row}: {err.error}</li>
                  ))}
                </ul>
              )}
            </div>
            <button onClick={() => setImportResult(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
              <X size={15} />
            </button>
          </div>
        )}

        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-9"
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-4 h-52 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="card p-12 flex flex-col items-center text-center">
            <Package size={40} className="text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">No hay productos aún</p>
            <p className="text-sm text-slate-500 mt-1">Creá tu primer producto o importá tu catálogo desde CSV/Excel</p>
            <Link href="/products/new" className="btn-primary mt-4 text-sm">Crear producto</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.data?.map((product: any) => (
              <div key={product.id} className="card p-4 flex flex-col gap-3">
                <div className="w-full h-36 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain bg-white" />
                  ) : (
                    <Package size={32} className="text-slate-300" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-slate-900 truncate">{product.name}</p>
                  {product.sku && <p className="text-xs text-slate-500 font-mono mt-0.5">{product.sku}</p>}
                  {product.category && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 text-xs">
                      {product.category}
                    </span>
                  )}
                  {product.variants?.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">{product.variants.length} variante{product.variants.length > 1 ? 's' : ''}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <Link href={`/products/${product.id}`} className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5">
                    <Pencil size={13} /> Editar
                  </Link>
                  <button
                    onClick={() => { if (confirm('¿Desactivar este producto?')) deactivate.mutate(product.id); }}
                    className="text-slate-500 hover:text-red-400 transition-colors px-2"
                    title="Desactivar"
                  >
                    <EyeOff size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary text-sm py-1 px-3 disabled:opacity-40">Anterior</button>
            <span className="text-sm text-slate-400 py-1 px-2">{page} / {data.totalPages}</span>
            <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} className="btn-secondary text-sm py-1 px-3 disabled:opacity-40">Siguiente</button>
          </div>
        )}
      </div>
    </div>
  );
}
