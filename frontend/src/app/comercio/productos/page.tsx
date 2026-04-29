"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search, Plus, Edit3, Trash2, Package, AlertTriangle,
  TrendingUp, Box, X, Loader2, Check,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { productsApi } from "@/lib/api";

interface Product {
  id: string;
  name: string;
  brand: string;
  emoji: string;
  price: number;
  proPrice?: number;
  unit: string;
  stock: number;
  isActive: boolean;
  isPromo: boolean;
  description?: string;
  categoryId: string;
  supplierId: string;
  category?: { name: string; emoji: string };
}

interface ProductForm {
  name: string;
  brand: string;
  emoji: string;
  price: string;
  proPrice: string;
  unit: string;
  stock: string;
  description: string;
  categoryId: string;
  supplierId: string;
}

const EMPTY_FORM: ProductForm = {
  name: "", brand: "", emoji: "📦", price: "", proPrice: "",
  unit: "unidad", stock: "", description: "", categoryId: "", supplierId: "",
};

function stockStatus(stock: number) {
  if (stock === 0)  return { label: "Agotado",    color: "bg-danger-50 text-danger-500",   dot: "bg-danger-500" };
  if (stock < 20)   return { label: "Stock bajo",  color: "bg-warning-50 text-warning-500", dot: "bg-warning-500" };
  return               { label: "Disponible",  color: "bg-success-50 text-success-500", dot: "bg-success-500" };
}

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"todos" | "disponible" | "bajo" | "agotado">("todos");

  // Modal
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete
  const [deleting, setDeleting] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    productsApi.getAll()
      .then((data) => setProducts(data as Product[]))
      .catch(() => setError("No se pudieron cargar los productos"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase());
      const st = stockStatus(p.stock).label;
      const matchStock =
        stockFilter === "todos" ||
        (stockFilter === "disponible" && st === "Disponible") ||
        (stockFilter === "bajo" && st === "Stock bajo") ||
        (stockFilter === "agotado" && st === "Agotado");
      return matchSearch && matchStock;
    });
  }, [products, search, stockFilter]);

  // KPIs
  const lowStock  = products.filter((p) => p.stock > 0 && p.stock < 20).length;
  const outStock  = products.filter((p) => p.stock === 0).length;

  function openCreate() {
    setForm(EMPTY_FORM);
    setSaveError(null);
    setEditing(null);
    setModal("create");
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name, brand: p.brand, emoji: p.emoji,
      price: p.price.toString(), proPrice: p.proPrice?.toString() ?? "",
      unit: p.unit, stock: p.stock.toString(),
      description: p.description ?? "",
      categoryId: p.categoryId, supplierId: p.supplierId,
    });
    setSaveError(null);
    setEditing(p);
    setModal("edit");
  }

  function closeModal() { setModal(null); setEditing(null); }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      emoji: form.emoji.trim() || "📦",
      price: parseFloat(form.price),
      proPrice: form.proPrice ? parseFloat(form.proPrice) : undefined,
      unit: form.unit.trim(),
      stock: parseInt(form.stock, 10) || 0,
      description: form.description.trim() || undefined,
      categoryId: form.categoryId.trim(),
      supplierId: form.supplierId.trim(),
    };
    try {
      if (modal === "create") {
        await productsApi.create(payload);
      } else if (editing) {
        await productsApi.update(editing.id, payload);
      }
      closeModal();
      load();
    } catch (err: any) {
      setSaveError(err?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    setDeleting(id);
    try {
      await productsApi.remove(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("No se pudo eliminar el producto");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-dark-800">📦 Gestión de Productos</h1>
          <p className="text-sm text-gray-500 mt-1">Inventario, precios y stock en tiempo real</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-navy-500 hover:bg-navy-600 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar producto
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { icon: Box,           label: "Total productos", value: products.length.toString(), color: "text-navy-500",    bg: "bg-navy-50" },
          { icon: AlertTriangle, label: "Stock bajo",      value: lowStock.toString(),         color: "text-warning-500", bg: "bg-warning-50" },
          { icon: Package,       label: "Agotados",        value: outStock.toString(),          color: "text-danger-500",  bg: "bg-danger-50" },
          { icon: TrendingUp,    label: "Activos",         value: products.filter(p => p.isActive).length.toString(), color: "text-success-500", bg: "bg-success-50" },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", kpi.bg)}>
                <kpi.icon className={cn("w-5 h-5", kpi.color)} />
              </div>
              <div>
                <div className="text-xl font-extrabold text-dark-800">{kpi.value}</div>
                <div className="text-[11px] text-gray-400">{kpi.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o marca..."
            className="flex-1 bg-transparent text-sm outline-none text-dark-800"
          />
        </div>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
          className="bg-gray-50 border-0 rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 outline-none"
        >
          <option value="todos">Todo estado</option>
          <option value="disponible">Disponible</option>
          <option value="bajo">Stock bajo</option>
          <option value="agotado">Agotado</option>
        </select>
      </div>

      {/* Error */}
      {error && <div className="mb-4 bg-danger-50 text-danger-600 text-sm px-4 py-3 rounded-xl">{error}</div>}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-navy-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            {products.length === 0 ? "No hay productos cargados todavía." : "Ningún producto coincide con los filtros."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Producto</th>
                  <th className="text-left px-3 py-3">Categoría</th>
                  <th className="text-right px-3 py-3">Precio</th>
                  <th className="text-right px-3 py-3">Stock</th>
                  <th className="text-center px-3 py-3">Estado</th>
                  <th className="text-center px-3 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => {
                  const sc = stockStatus(p.stock);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{p.emoji}</span>
                          <div>
                            <div className="font-semibold text-dark-800">{p.name}</div>
                            <div className="text-[11px] text-gray-400">{p.brand} · {p.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-xs text-gray-500">
                        {p.category ? `${p.category.emoji} ${p.category.name}` : "—"}
                      </td>
                      <td className="px-3 py-3.5 text-right font-bold text-dark-800">
                        {formatCurrency(p.price)}
                        {p.proPrice && (
                          <div className="text-[10px] text-brand-500 font-normal">
                            Pro: {formatCurrency(p.proPrice)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3.5 text-right font-semibold text-dark-800">{p.stock}</td>
                      <td className="px-3 py-3.5 text-center">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold", sc.color)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg hover:bg-navy-50 text-gray-400 hover:text-navy-500 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deleting === p.id}
                            className="p-1.5 rounded-lg hover:bg-danger-50 text-gray-400 hover:text-danger-500 transition-colors disabled:opacity-40"
                          >
                            {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
          Mostrando {filtered.length} de {products.length} productos
        </div>
      </div>

      {/* Modal crear / editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-extrabold text-dark-800">
                {modal === "create" ? "Agregar producto" : "Editar producto"}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Emoji</label>
                  <input
                    value={form.emoji}
                    onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500 text-center text-2xl"
                    maxLength={2}
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Nombre *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: Cemento Portland 50kg"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Marca *</label>
                  <input
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="Ej: Loma Negra"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Unidad *</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500"
                  >
                    {["unidad", "bolsa", "barra", "rollo", "caja", "bidón", "metro", "kg", "litro", "tramo", "hoja", "par"].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Precio *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0"
                    min={0}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Precio Pro</label>
                  <input
                    type="number"
                    value={form.proPrice}
                    onChange={(e) => setForm({ ...form, proPrice: e.target.value })}
                    placeholder="Opcional"
                    min={0}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">Stock inicial</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="0"
                    min={0}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">ID Categoría *</label>
                  <input
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    placeholder="ID de la categoría"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">ID Proveedor *</label>
                  <input
                    value={form.supplierId}
                    onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                    placeholder="ID del proveedor"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descripción opcional del producto..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500 resize-none"
                />
              </div>

              {saveError && (
                <div className="bg-danger-50 text-danger-600 text-sm px-3 py-2 rounded-lg">{saveError}</div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={closeModal}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.price || !form.brand}
                className="flex-1 bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? "Guardando..." : modal === "create" ? "Crear producto" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
