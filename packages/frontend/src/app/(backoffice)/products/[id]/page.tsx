'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, formatARS } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Loader2, Upload, DollarSign, History, Tag } from 'lucide-react';

type PriceType = 'B2C' | 'B2B';

function PricesSection({ productId }: { productId: string }) {
  const qc = useQueryClient();

  const { data: prices = [] } = useQuery({
    queryKey: ['prices', productId],
    queryFn: () => api.get(`/products/${productId}/prices`).then((r) => r.data),
  });

  const { data: history = [] } = useQuery({
    queryKey: ['prices-history', productId],
    queryFn: () => api.get(`/products/${productId}/prices/history`).then((r) => r.data),
  });

  const [tab, setTab] = useState<PriceType>('B2C');
  const [showHistory, setShowHistory] = useState(false);

  const current = prices.find((p: any) => p.type === tab);

  const [basePrice, setBasePrice] = useState('');
  const [reason, setReason] = useState('');
  const [volumeRows, setVolumeRows] = useState<{ minQuantity: string; discountPercent: string }[]>([]);
  const [scheduled, setScheduled] = useState({ discountPercent: '', startDate: '', endDate: '', label: '' });
  const [useScheduled, setUseScheduled] = useState(false);

  useEffect(() => {
    if (current) {
      setBasePrice(String(current.basePrice / 100));
      setVolumeRows(
        (current.volumePrices ?? []).map((v: any) => ({
          minQuantity: String(v.minQuantity),
          discountPercent: String(v.discountPercent),
        })),
      );
      if (current.scheduledDiscount) {
        setScheduled({
          discountPercent: String(current.scheduledDiscount.discountPercent),
          startDate: current.scheduledDiscount.startDate,
          endDate: current.scheduledDiscount.endDate,
          label: current.scheduledDiscount.label ?? '',
        });
        setUseScheduled(true);
      } else {
        setScheduled({ discountPercent: '', startDate: '', endDate: '', label: '' });
        setUseScheduled(false);
      }
    } else {
      setBasePrice('');
      setVolumeRows([]);
      setScheduled({ discountPercent: '', startDate: '', endDate: '', label: '' });
      setUseScheduled(false);
    }
  }, [tab, prices]);

  const setPrice = useMutation({
    mutationFn: (body: any) => api.post(`/products/${productId}/prices`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prices', productId] });
      qc.invalidateQueries({ queryKey: ['prices-history', productId] });
      setReason('');
    },
  });

  const handleSave = () => {
    const cents = Math.round(parseFloat(basePrice) * 100);
    if (isNaN(cents) || cents < 0) return;
    setPrice.mutate({
      type: tab,
      basePrice: cents,
      reason: reason || undefined,
      volumePrices: volumeRows
        .filter((r) => r.minQuantity && r.discountPercent)
        .map((r) => ({ minQuantity: Number(r.minQuantity), discountPercent: Number(r.discountPercent) })),
      scheduledDiscount: useScheduled && scheduled.discountPercent && scheduled.startDate && scheduled.endDate
        ? {
            discountPercent: Number(scheduled.discountPercent),
            startDate: scheduled.startDate,
            endDate: scheduled.endDate,
            label: scheduled.label || undefined,
          }
        : undefined,
    });
  };

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign size={15} className="text-slate-400" />
          <h2 className="font-semibold text-slate-700">Precios</h2>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs text-slate-400 hover:text-orange-500 flex items-center gap-1"
        >
          <History size={13} /> Historial
        </button>
      </div>

      {showHistory ? (
        <div className="px-5 py-4 space-y-2 max-h-64 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Sin cambios registrados.</p>
          ) : (
            history.map((h: any) => (
              <div key={h.id} className="flex items-start justify-between text-sm border-b border-slate-50 pb-2">
                <div>
                  <span className="font-medium text-slate-700">{h.type}</span>
                  <span className="text-slate-400 mx-2">→</span>
                  <span className="text-slate-800">{formatARS(h.basePrice)}</span>
                  {h.reason && <p className="text-xs text-slate-400 mt-0.5 italic">{h.reason}</p>}
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap ml-3">
                  {new Date(h.changedAt).toLocaleDateString('es-AR')}
                </span>
              </div>
            ))
          )}
          <button onClick={() => setShowHistory(false)} className="text-xs text-orange-500 mt-1">← Volver</button>
        </div>
      ) : (
        <div className="px-5 py-4 space-y-4">
          {/* Tabs B2C / B2B */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
            {(['B2C', 'B2B'] as PriceType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'B2C' ? 'B2C (con IVA)' : 'B2B (sin IVA)'}
              </button>
            ))}
          </div>

          {/* Precio base */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Precio base (ARS)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input w-full pl-7"
                placeholder="0.00"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
              />
            </div>
            {current && (
              <p className="text-xs text-slate-400 mt-1">
                Precio actual: <span className="font-medium text-slate-600">{formatARS(current.basePrice)}</span>
              </p>
            )}
          </div>

          {/* Descuentos por volumen */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-600">Descuentos por volumen</label>
              <button
                type="button"
                onClick={() => setVolumeRows([...volumeRows, { minQuantity: '', discountPercent: '' }])}
                className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1"
              >
                <Plus size={12} /> Agregar
              </button>
            </div>
            {volumeRows.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Sin descuentos por volumen</p>
            ) : (
              <div className="space-y-2">
                {volumeRows.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <input
                        type="number" min="1" placeholder="Cant. mínima"
                        className="input w-full text-sm"
                        value={row.minQuantity}
                        onChange={(e) => setVolumeRows(volumeRows.map((r, j) => j === i ? { ...r, minQuantity: e.target.value } : r))}
                      />
                    </div>
                    <div className="flex-1 relative">
                      <input
                        type="number" min="0.01" max="100" step="0.01" placeholder="% descuento"
                        className="input w-full text-sm pr-7"
                        value={row.discountPercent}
                        onChange={(e) => setVolumeRows(volumeRows.map((r, j) => j === i ? { ...r, discountPercent: e.target.value } : r))}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                    </div>
                    <button type="button" onClick={() => setVolumeRows(volumeRows.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Descuento programado */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useScheduled}
                onChange={(e) => setUseScheduled(e.target.checked)}
                className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-slate-600">Descuento programado</span>
              <Tag size={13} className="text-slate-400" />
            </label>
            {useScheduled && (
              <div className="mt-3 space-y-2 pl-5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Desde</label>
                    <input type="date" className="input w-full text-sm" value={scheduled.startDate}
                      onChange={(e) => setScheduled({ ...scheduled, startDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Hasta</label>
                    <input type="date" className="input w-full text-sm" value={scheduled.endDate}
                      onChange={(e) => setScheduled({ ...scheduled, endDate: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <label className="block text-xs text-slate-500 mb-1">% de descuento</label>
                    <input type="number" min="0.01" max="100" step="0.01" className="input w-full text-sm pr-7"
                      value={scheduled.discountPercent}
                      onChange={(e) => setScheduled({ ...scheduled, discountPercent: e.target.value })} />
                    <span className="absolute right-3 bottom-2.5 text-slate-400 text-xs">%</span>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Etiqueta (opcional)</label>
                    <input type="text" className="input w-full text-sm" placeholder="Ej: Promo Invierno"
                      value={scheduled.label}
                      onChange={(e) => setScheduled({ ...scheduled, label: e.target.value })} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Motivo del cambio (opcional)</label>
            <input
              className="input w-full text-sm"
              placeholder="Ej: Actualización de lista de precios junio 2026"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!basePrice || setPrice.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {setPrice.isPending && <Loader2 size={14} className="animate-spin" />}
            {setPrice.isPending ? 'Guardando...' : setPrice.isSuccess ? '¡Precio guardado!' : `Guardar precio ${tab}`}
          </button>
        </div>
      )}
    </div>
  );
}

const CATEGORIES = [
  'Cemento y Hormigón', 'Cerámica y Porcellanato', 'Pinturas', 'Hierro y Acero',
  'Electricidad', 'Plomería', 'Madera y Tableros', 'Aislación', 'Techos',
  'Aberturas', 'Herramientas', 'Sanitarios', 'Iluminación', 'Otro',
];

const UNITS = ['m2', 'm3', 'ml', 'kg', 'tn', 'bolsa', 'unidad', 'caja', 'rollo', 'pallet'];

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get(`/products/${id}`).then((r) => r.data),
  });

  const [form, setForm] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    subcategory: '',
    brand: '',
    unitOfMeasure: '',
  });

  const [variants, setVariants] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name ?? '',
        sku: product.sku ?? '',
        description: product.description ?? '',
        category: product.category ?? '',
        subcategory: product.subcategory ?? '',
        brand: product.brand ?? '',
        unitOfMeasure: product.unitOfMeasure ?? '',
      });
      setVariants(product.variants ?? []);
    }
  }, [product]);

  const update = useMutation({
    mutationFn: (data: any) => api.put(`/products/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product', id] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    update.mutate({
      ...form,
      sku: form.sku || undefined,
      description: form.description || undefined,
      category: form.category || undefined,
      subcategory: form.subcategory || undefined,
      brand: form.brand || undefined,
      unitOfMeasure: form.unitOfMeasure || undefined,
      variants: variants.length > 0 ? variants.map(({ id: _id, ...v }) => v) : undefined,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    try {
      await api.post(`/products/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      qc.invalidateQueries({ queryKey: ['product', id] });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const addVariant = () =>
    setVariants([...variants, { name: '', skuVariant: '', attributes: {} }]);

  const updateVariant = (i: number, key: string, val: string) =>
    setVariants(variants.map((v, idx) => idx === i ? { ...v, [key]: val } : v));

  const removeVariant = (i: number) =>
    setVariants(variants.filter((_, idx) => idx !== i));

  if (isLoading) {
    return (
      <div>
        <Header title="Editar producto" />
        <div className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 h-32 animate-pulse bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Editar producto" />
      <div className="p-6 max-w-2xl">

        <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5">
          <ArrowLeft size={15} /> Volver a productos
        </Link>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Imágenes */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-700">Imágenes</h2>
              <label className={`btn-secondary text-sm flex items-center gap-1.5 cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? 'Subiendo...' : 'Subir imagen'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            {product?.images?.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((url: string, i: number) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-sm text-slate-400">
                Sin imágenes aún. Subí hasta 10 fotos del producto.
              </div>
            )}
          </div>

          {/* Información básica */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-slate-700">Información básica</h2>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                className="input w-full"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">SKU</label>
                <input
                  className="input w-full font-mono"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Marca</label>
                <input
                  className="input w-full"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Descripción</label>
              <textarea
                className="input w-full h-24 resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          {/* Clasificación */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-slate-700">Clasificación</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Categoría</label>
                <select
                  className="input w-full"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Subcategoría</label>
                <input
                  className="input w-full"
                  value={form.subcategory}
                  onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Unidad de medida</label>
              <div className="flex flex-wrap gap-2">
                {UNITS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setForm({ ...form, unitOfMeasure: form.unitOfMeasure === u ? '' : u })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.unitOfMeasure === u
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Variantes */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-700">Variantes</h2>
                <p className="text-xs text-slate-400 mt-0.5">Ej: tamaños, colores, presentaciones</p>
              </div>
              <button type="button" onClick={addVariant} className="btn-secondary text-sm flex items-center gap-1.5">
                <Plus size={14} /> Agregar
              </button>
            </div>

            {variants.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-lg">
                Sin variantes — presentación única
              </p>
            )}

            {variants.map((variant, i) => (
              <div key={i} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Nombre *</label>
                    <input
                      className="input w-full text-sm"
                      value={variant.name}
                      onChange={(e) => updateVariant(i, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">SKU variante</label>
                    <input
                      className="input w-full text-sm font-mono"
                      value={variant.skuVariant ?? ''}
                      onChange={(e) => updateVariant(i, 'skuVariant', e.target.value)}
                    />
                  </div>
                </div>
                <button type="button" onClick={() => removeVariant(i)} className="text-slate-400 hover:text-red-500 mt-6">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Acciones */}
          <div className="flex gap-3">
            <Link href="/products" className="btn-secondary flex-1 text-center">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={update.isPending || !form.name.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {update.isPending && <Loader2 size={15} className="animate-spin" />}
              {update.isPending ? 'Guardando...' : update.isSuccess ? '¡Guardado!' : 'Guardar cambios'}
            </button>
          </div>

          {update.isError && (
            <p className="text-sm text-red-500 text-center">Error al guardar. Intentá de nuevo.</p>
          )}
        </form>

        {/* Precios — fuera del form de producto */}
        <PricesSection productId={id} />
      </div>
    </div>
  );
}
