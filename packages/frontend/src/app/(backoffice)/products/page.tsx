'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Plus, Search, Package, Pencil, EyeOff } from 'lucide-react';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

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

  return (
    <div>
      <Header title="Productos" />
      <div className="p-6 space-y-4">

        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Buscar por nombre o SKU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Link href="/products/new" className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus size={16} /> Nuevo producto
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-4 h-40 animate-pulse bg-slate-100" />
            ))}
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="card p-12 flex flex-col items-center text-center">
            <Package size={40} className="text-slate-300 mb-3" />
            <p className="font-medium text-slate-600">No hay productos aún</p>
            <p className="text-sm text-slate-400 mt-1">Creá tu primer producto o importá desde CSV</p>
            <Link href="/products/new" className="btn-primary mt-4">Crear producto</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.data?.map((product: any) => (
              <div key={product.id} className="card p-4 flex flex-col gap-3">
                {/* Imagen */}
                <div className="w-full h-36 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={32} className="text-slate-300" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-medium text-slate-800 truncate">{product.name}</p>
                  {product.sku && <p className="text-xs text-slate-400 font-mono">{product.sku}</p>}
                  {product.category && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
                      {product.category}
                    </span>
                  )}
                  {product.variants?.length > 0 && (
                    <p className="text-xs text-slate-400 mt-1">{product.variants.length} variante{product.variants.length > 1 ? 's' : ''}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <Link href={`/products/${product.id}`} className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-sm py-1.5">
                    <Pencil size={13} /> Editar
                  </Link>
                  <button
                    onClick={() => { if (confirm('¿Desactivar este producto?')) deactivate.mutate(product.id); }}
                    className="text-slate-400 hover:text-red-500 transition-colors px-2"
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
            <span className="text-sm text-slate-600 py-1 px-2">{page} / {data.totalPages}</span>
            <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} className="btn-secondary text-sm py-1 px-3 disabled:opacity-40">Siguiente</button>
          </div>
        )}
      </div>
    </div>
  );
}
