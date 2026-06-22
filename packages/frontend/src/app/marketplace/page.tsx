"use client";

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api, formatARS } from '@/lib/api';
import Reveal from '@/components/Reveal';

function fetchProducts() {
  return api.get('/products').then((r) => r.data);
}

export default function MarketplacePage() {
  const { data: products = [], isLoading } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Marketplace</h1>
          <div className="text-sm text-slate-600">Mostrando {products.length} productos</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && <div>Cargando productos...</div>}
          {!isLoading && products.map((p: any, idx: number) => (
            <Reveal key={p.id}><ProductCard product={p} /></Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
  const price = product?.price ?? null;
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="h-40 bg-slate-100 rounded-md mb-3 flex items-center justify-center text-slate-400">Imagen</div>
      <div className="text-sm text-slate-500 mb-1">{product.company?.razonSocial ?? product.companyId}</div>
      <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-700">{price ? formatARS(price.basePrice) : '—'}</div>
        <Link href={`/products/${product.id}`} className="text-sm text-orange-500">Ver</Link>
      </div>
    </div>
  );
}
