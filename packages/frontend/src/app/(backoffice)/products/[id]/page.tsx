'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, formatARS } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Loader2, Upload, DollarSign, History, Tag, Star, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

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

  // Bug #5 (QA 18/11): la regla comercial es que todos los precios van con IVA
  // incluido y la tienda solo usa B2C. Se saca la pestaña B2B de la pantalla
  // (el tipo B2B sigue existiendo en la API por si se retoma un canal mayorista).
  const tab: PriceType = 'B2C';
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
    <div className="card overflow-hidden mt-6">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign size={15} className="text-slate-500" />
          <h2 className="font-bold text-slate-900">Precios</h2>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs text-slate-500 hover:text-orange-500 flex items-center gap-1 transition-colors"
        >
          <History size={13} /> Historial
        </button>
      </div>

      {showHistory ? (
        <div className="px-5 py-4 space-y-2 max-h-64 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Sin cambios registrados.</p>
          ) : (
            history.map((h: any) => (
              <div key={h.id} className="flex items-start justify-between text-sm border-b border-slate-100 pb-2">
                <div>
                  <span className="text-slate-900">{formatARS(h.basePrice)}</span>
                  {h.reason && <p className="text-xs text-slate-500 mt-0.5 italic">{h.reason}</p>}
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap ml-3">
                  {new Date(h.changedAt).toLocaleDateString('es-AR')}
                </span>
              </div>
            ))
          )}
          <button onClick={() => setShowHistory(false)} className="text-xs text-orange-500 mt-1 hover:text-orange-600">← Volver</button>
        </div>
      ) : (
        <div className="px-5 py-4 space-y-4">
          {/* Precio base */}
          <div>
            <label className="label">Precio de venta (ARS, IVA incluido)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
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
              <p className="text-xs text-slate-500 mt-1">
                Precio actual: <span className="font-medium text-slate-700">{formatARS(current.basePrice)}</span>
              </p>
            )}
          </div>

          {/* Descuentos por volumen */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Descuentos por volumen</label>
              <button
                type="button"
                onClick={() => setVolumeRows([...volumeRows, { minQuantity: '', discountPercent: '' }])}
                className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
              >
                <Plus size={12} /> Agregar
              </button>
            </div>
            {volumeRows.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Sin descuentos por volumen</p>
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
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                    </div>
                    <button type="button" onClick={() => setVolumeRows(volumeRows.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400 transition-colors">
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
                className="rounded border-slate-300 bg-white text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-slate-600">Descuento programado</span>
              <Tag size={13} className="text-slate-500" />
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
                    <span className="absolute right-3 bottom-2.5 text-slate-500 text-xs">%</span>
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
            <label className="label">Motivo del cambio (opcional)</label>
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
  const params = useParams() as { id: string };
  const { id } = params;
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
  // Bug #6: si al crear el producto no se pudo guardar el precio o las fotos.
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('pendiente');
    if (p) setPending(p.split(',').join(' y '));
  }, []);

  // Bug #8 (QA 18/11): borrar, reordenar y elegir la foto principal.
  const setImages = useMutation({
    mutationFn: (images: string[]) => api.put(`/products/${id}/images`, { images }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['product', id] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
  const images: string[] = product?.images ?? [];
  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [img] = next.splice(from, 1);
    next.splice(to, 0, img);
    setImages.mutate(next);
  };
  const removeImage = (i: number) => {
    if (!window.confirm('¿Borrar esta foto del producto?')) return;
    setImages.mutate(images.filter((_, j) => j !== i));
  };

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
            <div key={i} className="card p-4 h-32 animate-pulse bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Editar producto" />
      <div className="p-6 max-w-2xl">

        <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-5 transition-colors">
          <ArrowLeft size={15} /> Volver a productos
        </Link>

        {pending && (
          <div className="mb-5 rounded-2xl p-4 flex items-start gap-3 border bg-amber-50 border-amber-200">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 flex-1">
              El producto se creó, pero no se pudieron guardar {pending === 'precio' ? 'el precio' : pending === 'fotos' ? 'las fotos' : 'el precio y las fotos'}. Cargalos acá abajo.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Imágenes */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Imágenes</h2>
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

            {images.length > 0 ? (
              <>
                <div className={`grid grid-cols-4 gap-2 ${setImages.isPending ? 'opacity-60 pointer-events-none' : ''}`}>
                  {images.map((url: string, i: number) => (
                    <div key={url} className="group relative aspect-square rounded-xl overflow-hidden bg-white border border-slate-200">
                      <img src={url} alt="" className="w-full h-full object-contain" />
                      {i === 0 && (
                        <span className="absolute top-1 left-1 text-[10px] font-semibold bg-orange-500 text-white px-1.5 py-0.5 rounded">Principal</span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-white/90 px-1 py-0.5">
                        <div className="flex">
                          <button type="button" onClick={() => moveImage(i, i - 1)} disabled={i === 0} className="p-1 text-slate-600 hover:text-orange-600 disabled:opacity-30" aria-label="Mover a la izquierda">
                            <ChevronLeft size={14} />
                          </button>
                          <button type="button" onClick={() => moveImage(i, i + 1)} disabled={i === images.length - 1} className="p-1 text-slate-600 hover:text-orange-600 disabled:opacity-30" aria-label="Mover a la derecha">
                            <ChevronRight size={14} />
                          </button>
                        </div>
                        <div className="flex">
                          {i !== 0 && (
                            <button type="button" onClick={() => moveImage(i, 0)} className="p-1 text-slate-600 hover:text-orange-600" title="Hacer principal" aria-label="Hacer principal">
                              <Star size={14} />
                            </button>
                          )}
                          <button type="button" onClick={() => removeImage(i)} className="p-1 text-slate-600 hover:text-red-500" title="Borrar foto" aria-label="Borrar foto">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500">La foto principal es la que se ve en la tienda. Usá las flechas o la estrella para cambiarla.</p>
                {setImages.isError && <p className="text-xs text-red-500">No se pudieron guardar los cambios en las fotos. Intentá de nuevo.</p>}
              </>
            ) : (
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center text-sm text-slate-500">
                Sin imágenes aún. Subí hasta 10 fotos del producto.
              </div>
            )}
          </div>

          {/* Información básica */}
          <div className="card p-5 space-y-4">
            <h2 className="font-bold text-slate-900">Información básica</h2>

            <div>
              <label className="label">Nombre <span className="text-red-400">*</span></label>
              <input
                className="input w-full"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">SKU</label>
                <input
                  className="input w-full font-mono"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Marca</label>
                <input
                  className="input w-full"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Descripción</label>
              <textarea
                className="input w-full h-24 resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          {/* Clasificación */}
          <div className="card p-5 space-y-4">
            <h2 className="font-bold text-slate-900">Clasificación</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Categoría</label>
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
                <label className="label">Subcategoría</label>
                <input
                  className="input w-full"
                  value={form.subcategory}
                  onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Unidad de medida</label>
              <div className="flex flex-wrap gap-2">
                {UNITS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setForm({ ...form, unitOfMeasure: form.unitOfMeasure === u ? '' : u })}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      form.unitOfMeasure === u
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-slate-900'
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
                <h2 className="font-bold text-slate-900">Variantes</h2>
                <p className="text-xs text-slate-500 mt-0.5">Ej: tamaños, colores, presentaciones</p>
              </div>
              <button type="button" onClick={addVariant} className="btn-secondary text-sm flex items-center gap-1.5">
                <Plus size={14} /> Agregar
              </button>
            </div>

            {variants.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4 border border-dashed border-slate-300 rounded-xl">
                Sin variantes — presentación única
              </p>
            )}

            {variants.map((variant, i) => (
              <div key={i} className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-200">
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
                <button type="button" onClick={() => removeVariant(i)} className="text-slate-500 hover:text-red-400 mt-6 transition-colors">
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
            <p className="text-sm text-red-400 text-center">Error al guardar. Intentá de nuevo.</p>
          )}
        </form>

        <PricesSection productId={id} />
      </div>
    </div>
  );
}
