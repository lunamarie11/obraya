'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Loader2, Upload, X } from 'lucide-react';

const CATEGORIES = [
  'Cemento y Hormigón', 'Cerámica y Porcellanato', 'Pinturas', 'Hierro y Acero',
  'Electricidad', 'Plomería', 'Madera y Tableros', 'Aislación', 'Techos',
  'Aberturas', 'Herramientas', 'Sanitarios', 'Iluminación', 'Otro',
];

const UNITS = ['m2', 'm3', 'ml', 'kg', 'tn', 'bolsa', 'unidad', 'caja', 'rollo', 'pallet'];

interface Variant {
  name: string;
  skuVariant: string;
  attributes: Record<string, string>;
}

export default function NewProductPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    subcategory: '',
    brand: '',
    unitOfMeasure: '',
  });

  const [variants, setVariants] = useState<Variant[]>([]);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  // Bug #6 (QA 18/11): fotos y precio se cargan en el mismo paso que el
  // producto. Se suben después de crearlo (los endpoints necesitan el id).
  const [price, setPrice] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const create = useMutation({
    mutationFn: async (data: any) => {
      const { data: product } = await api.post('/products', data);
      const pending: string[] = [];

      const cents = Math.round(parseFloat(price.replace(',', '.')) * 100);
      if (price.trim() && !isNaN(cents) && cents >= 0) {
        try {
          await api.post(`/products/${product.id}/prices`, { type: 'B2C', basePrice: cents });
        } catch {
          pending.push('precio');
        }
      }

      if (files.length) {
        const fd = new FormData();
        files.forEach((f) => fd.append('files', f));
        try {
          await api.post(`/products/${product.id}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        } catch {
          pending.push('fotos');
        }
      }
      return { id: product.id, pending };
    },
    onSuccess: ({ id, pending }) =>
      router.push(`/products/${id}${pending.length ? `?pendiente=${pending.join(',')}` : ''}`),
  });

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...picked].slice(0, 10));
    e.target.value = '';
  };

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = 'El nombre es obligatorio';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    create.mutate({
      ...form,
      sku: form.sku || undefined,
      description: form.description || undefined,
      category: form.category || undefined,
      subcategory: form.subcategory || undefined,
      brand: form.brand || undefined,
      unitOfMeasure: form.unitOfMeasure || undefined,
      variants: variants.length > 0 ? variants : undefined,
    });
  };

  const addVariant = () =>
    setVariants([...variants, { name: '', skuVariant: '', attributes: {} }]);

  const updateVariant = (i: number, key: keyof Variant, val: string) =>
    setVariants(variants.map((v, idx) => idx === i ? { ...v, [key]: val } : v));

  const removeVariant = (i: number) =>
    setVariants(variants.filter((_, idx) => idx !== i));

  return (
    <div>
      <Header title="Nuevo producto" />
      <div className="p-6 max-w-2xl">

        <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5">
          <ArrowLeft size={15} /> Volver a productos
        </Link>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Fotos */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-700">Fotos</h2>
              <label className={`btn-secondary text-sm flex items-center gap-1.5 cursor-pointer ${files.length >= 10 ? 'opacity-60 pointer-events-none' : ''}`}>
                <Upload size={14} /> Agregar fotos
                <input type="file" accept="image/*" multiple className="hidden" onChange={addFiles} />
              </label>
            </div>
            {previews.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {previews.map((url, i) => (
                  <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-white border border-slate-200">
                    <img src={url} alt="" className="w-full h-full object-contain" />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[10px] font-semibold bg-orange-500 text-white px-1.5 py-0.5 rounded">Principal</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-white/90 rounded-full p-0.5 text-slate-600 hover:text-red-500"
                      aria-label="Quitar foto"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center text-sm text-slate-500">
                Hasta 10 fotos. La primera es la que se ve en la tienda.
              </div>
            )}
          </div>

          {/* Precio */}
          <div className="card p-5 space-y-2">
            <h2 className="font-semibold text-slate-700">Precio de venta</h2>
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input w-full pl-7"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <p className="text-xs text-slate-500">Con IVA incluido. Descuentos por volumen y promociones se configuran después, al editar.</p>
          </div>

          {/* Información básica */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-slate-700">Información básica</h2>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                className={`input w-full ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="Ej: Cemento Portland CPN 50"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">SKU</label>
                <input
                  className="input w-full"
                  placeholder="Ej: CEM-PORT-50"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Marca</label>
                <input
                  className="input w-full"
                  placeholder="Ej: Loma Negra"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Descripción</label>
              <textarea
                className="input w-full h-24 resize-none"
                placeholder="Describí el producto, sus características principales, aplicaciones..."
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
                  placeholder="Ej: Alta resistencia"
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
              <button
                type="button"
                onClick={addVariant}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                <Plus size={14} /> Agregar
              </button>
            </div>

            {variants.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-lg">
                Sin variantes — el producto se vende en presentación única
              </p>
            )}

            {variants.map((variant, i) => (
              <div key={i} className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Nombre variante *</label>
                    <input
                      className="input w-full text-sm"
                      placeholder="Ej: 25kg / Rojo / 60x60"
                      value={variant.name}
                      onChange={(e) => updateVariant(i, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">SKU variante</label>
                    <input
                      className="input w-full text-sm font-mono"
                      placeholder="Ej: CEM-25KG"
                      value={variant.skuVariant}
                      onChange={(e) => updateVariant(i, 'skuVariant', e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  className="text-slate-400 hover:text-red-500 transition-colors mt-6"
                >
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
              disabled={create.isPending}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {create.isPending && <Loader2 size={15} className="animate-spin" />}
              {create.isPending ? (files.length ? 'Creando y subiendo fotos...' : 'Creando...') : 'Crear producto'}
            </button>
          </div>

          {create.isError && (
            <p className="text-sm text-red-500 text-center">
              Error al crear el producto. Intentá de nuevo.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
