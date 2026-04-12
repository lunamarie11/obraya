"use client";

import { useState, useMemo } from "react";
import {
  Search, Plus, Edit3, Trash2, Package, AlertTriangle,
  ArrowUpDown, Eye, BarChart3, TrendingUp, Box, Filter,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────
type StockStatus = "disponible" | "bajo" | "agotado";
type Category = "todos" | "cemento" | "hierro" | "ceramica" | "pintura" | "plomeria" | "electricidad" | "madera";

interface Product {
  id: number;
  sku: string;
  name: string;
  brand: string;
  emoji: string;
  category: Category;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  status: StockStatus;
  sold30d: number;
  lastRestock: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────────
const PRODUCTS: Product[] = [
  { id: 1, sku: "CEM-001", name: "Cemento Portland Normal 50kg", brand: "Loma Negra", emoji: "🪨", category: "cemento", price: 6800, cost: 4900, stock: 342, minStock: 100, unit: "bolsa", status: "disponible", sold30d: 1280, lastRestock: "2026-04-10" },
  { id: 2, sku: "HIE-001", name: "Varilla Nervada Ø12mm x12m", brand: "Acindar", emoji: "🔩", category: "hierro", price: 4200, cost: 3100, stock: 85, minStock: 50, unit: "barra", status: "disponible", sold30d: 430, lastRestock: "2026-04-08" },
  { id: 3, sku: "CER-001", name: "Porcellanato 60×60 Gris Pulido", brand: "San Lorenzo", emoji: "🟦", category: "ceramica", price: 3800, cost: 2600, stock: 156, minStock: 40, unit: "caja", status: "disponible", sold30d: 312, lastRestock: "2026-04-05" },
  { id: 4, sku: "PIN-001", name: "Pintura Látex Interior Blanco 20L", brand: "Sherwin-Williams", emoji: "🎨", category: "pintura", price: 12500, cost: 8800, stock: 8, minStock: 20, unit: "bidón", status: "bajo", sold30d: 95, lastRestock: "2026-03-28" },
  { id: 5, sku: "CEM-002", name: "Cal Hidráulica Premium 25kg", brand: "Calera Avellaneda", emoji: "⚪", category: "cemento", price: 2800, cost: 1900, stock: 220, minStock: 80, unit: "bolsa", status: "disponible", sold30d: 640, lastRestock: "2026-04-09" },
  { id: 6, sku: "PLO-001", name: "Caño PVC 4\" Sanitario 3m", brand: "Fiplasma", emoji: "🔧", category: "plomeria", price: 1850, cost: 1200, stock: 0, minStock: 30, unit: "tramo", status: "agotado", sold30d: 178, lastRestock: "2026-03-15" },
  { id: 7, sku: "ELE-001", name: "Cable Unipolar 2.5mm IRAM 100m", brand: "Prysmian", emoji: "⚡", category: "electricidad", price: 980, cost: 650, stock: 410, minStock: 100, unit: "rollo", status: "disponible", sold30d: 520, lastRestock: "2026-04-11" },
  { id: 8, sku: "HIE-002", name: "Malla Electrosoldada 15×15 6×2.35m", brand: "Acindar", emoji: "🔩", category: "hierro", price: 8900, cost: 6400, stock: 12, minStock: 15, unit: "hoja", status: "bajo", sold30d: 67, lastRestock: "2026-04-01" },
  { id: 9, sku: "ELE-002", name: "Tablero 12 Circuitos DIN", brand: "Schneider Electric", emoji: "⚡", category: "electricidad", price: 18500, cost: 13200, stock: 24, minStock: 10, unit: "unidad", status: "disponible", sold30d: 38, lastRestock: "2026-04-06" },
  { id: 10, sku: "MAD-001", name: "Parquet Flotante Roble 2.5m²", brand: "Bambu Floors", emoji: "🪵", category: "madera", price: 5200, cost: 3600, stock: 5, minStock: 15, unit: "caja", status: "bajo", sold30d: 42, lastRestock: "2026-03-20" },
  { id: 11, sku: "PLO-002", name: "Llave de Paso 1/2\" Bronce", brand: "Ferrum", emoji: "🔧", category: "plomeria", price: 1200, cost: 780, stock: 180, minStock: 50, unit: "unidad", status: "disponible", sold30d: 210, lastRestock: "2026-04-07" },
  { id: 12, sku: "PIN-002", name: "Pintura Epoxi Piso Gris 4L", brand: "Sherwin-Williams", emoji: "🎨", category: "pintura", price: 8900, cost: 6100, stock: 35, minStock: 20, unit: "bidón", status: "disponible", sold30d: 88, lastRestock: "2026-04-03" },
];

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "cemento", label: "Cemento y Cal" },
  { id: "hierro", label: "Hierro" },
  { id: "ceramica", label: "Cerámicas" },
  { id: "pintura", label: "Pinturas" },
  { id: "plomeria", label: "Plomería" },
  { id: "electricidad", label: "Electricidad" },
  { id: "madera", label: "Madera" },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function statusConfig(s: StockStatus) {
  switch (s) {
    case "disponible": return { label: "Disponible", color: "bg-success-50 text-success-500", dot: "bg-success-500" };
    case "bajo": return { label: "Stock bajo", color: "bg-warning-50 text-warning-500", dot: "bg-warning-500" };
    case "agotado": return { label: "Agotado", color: "bg-danger-50 text-danger-500", dot: "bg-danger-500" };
  }
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ProductosPage() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<Category>("todos");
  const [statusFilter, setStatusFilter] = useState<StockStatus | "todos">("todos");
  const [sortBy, setSortBy] = useState<"name" | "stock" | "sold" | "margin">("name");
  const [showDetail, setShowDetail] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let list = PRODUCTS.filter((p) => {
      const matchCat = activeCat === "todos" || p.category === activeCat;
      const matchStatus = statusFilter === "todos" || p.status === statusFilter;
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchStatus && matchSearch;
    });
    list.sort((a, b) => {
      switch (sortBy) {
        case "stock": return a.stock - b.stock;
        case "sold": return b.sold30d - a.sold30d;
        case "margin": return ((b.price - b.cost) / b.price) - ((a.price - a.cost) / a.price);
        default: return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [search, activeCat, statusFilter, sortBy]);

  // KPIs
  const totalProducts = PRODUCTS.length;
  const lowStock = PRODUCTS.filter((p) => p.status === "bajo").length;
  const outOfStock = PRODUCTS.filter((p) => p.status === "agotado").length;
  const totalValue = PRODUCTS.reduce((s, p) => s + p.stock * p.cost, 0);
  const revenue30d = PRODUCTS.reduce((s, p) => s + p.sold30d * p.price, 0);
  const avgMargin = PRODUCTS.reduce((s, p) => s + ((p.price - p.cost) / p.price), 0) / PRODUCTS.length * 100;

  const detail = showDetail !== null ? PRODUCTS.find((p) => p.id === showDetail) : null;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-dark-800">📦 Gestión de Productos</h1>
          <p className="text-sm text-gray-500 mt-1">Inventario, precios y stock en tiempo real</p>
        </div>
        <button className="flex items-center gap-2 bg-navy-500 hover:bg-navy-600 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors">
          <Plus className="w-4 h-4" /> Agregar producto
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { icon: Box, label: "Total productos", value: totalProducts.toString(), color: "text-navy-500", bg: "bg-navy-50" },
          { icon: AlertTriangle, label: "Stock bajo", value: lowStock.toString(), color: "text-warning-500", bg: "bg-warning-50" },
          { icon: Package, label: "Agotados", value: outOfStock.toString(), color: "text-danger-500", bg: "bg-danger-50" },
          { icon: BarChart3, label: "Valor inventario", value: formatCurrency(totalValue), color: "text-info-500", bg: "bg-info-50" },
          { icon: TrendingUp, label: "Ventas 30 días", value: formatCurrency(revenue30d), color: "text-success-500", bg: "bg-success-50" },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", kpi.bg)}>
                <kpi.icon className={cn("w-5 h-5", kpi.color)} />
              </div>
              <div>
                <div className="text-lg font-extrabold text-dark-800">{kpi.value}</div>
                <div className="text-[11px] text-gray-400">{kpi.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="card p-4 mb-4 flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            className="flex-1 bg-transparent text-sm outline-none text-dark-800"
          />
        </div>

        <div className="flex gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                activeCat === c.id ? "bg-navy-500 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StockStatus | "todos")}
          className="bg-gray-50 border-0 rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 outline-none"
        >
          <option value="todos">Todo estado</option>
          <option value="disponible">Disponible</option>
          <option value="bajo">Stock bajo</option>
          <option value="agotado">Agotado</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="bg-gray-50 border-0 rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 outline-none"
        >
          <option value="name">Ordenar: Nombre</option>
          <option value="stock">Ordenar: Stock</option>
          <option value="sold">Ordenar: Más vendidos</option>
          <option value="margin">Ordenar: Margen</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="text-left px-5 py-3">Producto</th>
                <th className="text-left px-3 py-3">SKU</th>
                <th className="text-left px-3 py-3">Categoría</th>
                <th className="text-right px-3 py-3">Precio</th>
                <th className="text-right px-3 py-3">Costo</th>
                <th className="text-right px-3 py-3">Margen</th>
                <th className="text-right px-3 py-3">Stock</th>
                <th className="text-center px-3 py-3">Estado</th>
                <th className="text-right px-3 py-3">Vtas 30d</th>
                <th className="text-center px-3 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((p) => {
                const sc = statusConfig(p.status);
                const margin = ((p.price - p.cost) / p.price * 100).toFixed(1);
                const stockPercent = Math.min(100, (p.stock / p.minStock) * 100);
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.emoji}</span>
                        <div>
                          <div className="font-semibold text-dark-800">{p.name}</div>
                          <div className="text-[11px] text-gray-400">{p.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-xs text-gray-500">{p.sku}</td>
                    <td className="px-3 py-3.5 text-xs text-gray-500 capitalize">{p.category}</td>
                    <td className="px-3 py-3.5 text-right font-bold text-dark-800">{formatCurrency(p.price)}</td>
                    <td className="px-3 py-3.5 text-right text-gray-500">{formatCurrency(p.cost)}</td>
                    <td className="px-3 py-3.5 text-right">
                      <span className={cn("font-bold", Number(margin) >= 30 ? "text-success-500" : Number(margin) >= 20 ? "text-warning-500" : "text-danger-500")}>
                        {margin}%
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", stockPercent > 100 ? "bg-success-500" : stockPercent > 50 ? "bg-warning-500" : "bg-danger-500")}
                            style={{ width: `${Math.min(100, stockPercent)}%` }}
                          />
                        </div>
                        <span className="font-semibold text-dark-800 w-8 text-right">{p.stock}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold", sc.color)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-right font-semibold text-dark-800">{p.sold30d}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setShowDetail(showDetail === p.id ? null : p.id)}
                          className="p-1.5 rounded-lg hover:bg-navy-50 text-gray-400 hover:text-navy-500 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-navy-50 text-gray-400 hover:text-navy-500 transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-danger-50 text-gray-400 hover:text-danger-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>Mostrando {filtered.length} de {PRODUCTS.length} productos</span>
          <span>Margen promedio: <strong className="text-success-500">{avgMargin.toFixed(1)}%</strong></span>
        </div>
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[480px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-navy-500 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{detail.emoji}</span>
                <div>
                  <h2 className="font-bold text-lg">{detail.name}</h2>
                  <p className="text-white/70 text-sm">{detail.brand} · {detail.sku}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Precio venta", value: formatCurrency(detail.price) },
                  { label: "Costo", value: formatCurrency(detail.cost) },
                  { label: "Margen", value: `${((detail.price - detail.cost) / detail.price * 100).toFixed(1)}%` },
                ].map((d) => (
                  <div key={d.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-lg font-extrabold text-dark-800">{d.value}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{d.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Stock actual", value: `${detail.stock} ${detail.unit}s` },
                  { label: "Stock mínimo", value: `${detail.minStock} ${detail.unit}s` },
                  { label: "Vendidos 30d", value: detail.sold30d.toString() },
                ].map((d) => (
                  <div key={d.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-lg font-extrabold text-dark-800">{d.value}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{d.label}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-400">Último reabastecimiento: {detail.lastRestock}</div>
              <div className="flex gap-2">
                <button className="flex-1 bg-navy-500 hover:bg-navy-600 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
                  Editar producto
                </button>
                <button className="flex-1 bg-success-500 hover:bg-success-600 text-white font-bold py-2.5 rounded-lg text-sm transition-colors">
                  Reabastecer stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
