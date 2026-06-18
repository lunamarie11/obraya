'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';

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

  const create = useMutation({
    mutationFn: (data: any) => api.post('/products', data),
    onSuccess: (res) => router.push(`/products/${res.data.id}`),
  });

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
              {create.isPending ? 'Creando...' : 'Crear producto'}
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
