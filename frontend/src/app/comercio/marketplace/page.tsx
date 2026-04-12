"use client";

import { useState, useMemo } from "react";
import { Search, ShoppingCart, X, Plus, Minus, Truck } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  brand: string;
  emoji: string;
  badge?: string;
  badgeType?: "promo" | "default";
  price: number;
  oldPrice?: number;
  unit: string;
  stock: "ok" | "low";
  stockText: string;
  cat: string;
}

interface CartItem extends Product {
  qty: number;
}

// ── Data ───────────────────────────────────────────────────────────────────
const PRODUCTS: Product[] = [
  { id: 1, name: "Cemento Portland Normal", brand: "Loma Negra", emoji: "🪨", badge: "Más vendido", price: 6800, unit: "bolsa 50 kg", stock: "ok", stockText: "✓ Stock disponible", cat: "cemento" },
  { id: 2, name: "Varilla Nervada Ø12mm", brand: "Acindar", emoji: "🔩", badge: "Promo", badgeType: "promo", price: 4200, oldPrice: 4900, unit: "barra 12m", stock: "ok", stockText: "✓ Stock disponible", cat: "hierro" },
  { id: 3, name: "Porcellanato 60×60 Gris", brand: "San Lorenzo", emoji: "🟦", badge: "Destacado", price: 3800, unit: "caja 1.44m²", stock: "ok", stockText: "✓ Stock disponible", cat: "ceramica" },
  { id: 4, name: "Pintura Látex Interior Blanco", brand: "Sherwin-Williams", emoji: "🎨", badge: "Promo", badgeType: "promo", price: 12500, oldPrice: 14200, unit: "bidón 20L", stock: "low", stockText: "⚠ Últimas 8 unidades", cat: "pintura" },
  { id: 5, name: "Cal Hidráulica Premium", brand: "Calera Avellaneda", emoji: "⚪", price: 2800, unit: "bolsa 25 kg", stock: "ok", stockText: "✓ Stock disponible", cat: "cemento" },
  { id: 6, name: "Caño PVC 4\" Sanitario", brand: "Fiplasma", emoji: "🔧", price: 1850, unit: "tramo 3m", stock: "ok", stockText: "✓ Stock disponible", cat: "plomeria" },
  { id: 7, name: "Cable Unipolar 2.5mm IRAM", brand: "Prysmian", emoji: "⚡", badge: "Destacado", price: 980, unit: "rollo 100m", stock: "ok", stockText: "✓ Stock disponible", cat: "electricidad" },
  { id: 8, name: "Malla Electrosoldada 15×15cm", brand: "Acindar", emoji: "🔩", badge: "Promo", badgeType: "promo", price: 8900, oldPrice: 10200, unit: "hoja 6×2.35m", stock: "ok", stockText: "✓ Stock disponible", cat: "hierro" },
  { id: 9, name: "Tablero 12 Circuitos", brand: "Schneider Electric", emoji: "⚡", price: 18500, unit: "unidad", stock: "ok", stockText: "✓ Stock disponible", cat: "electricidad" },
  { id: 10, name: "Parquet Flotante Roble", brand: "Bambu Floors", emoji: "🪵", price: 5200, unit: "caja 2.5m²", stock: "low", stockText: "⚠ Pocas unidades", cat: "madera" },
  { id: 11, name: "Llave de Paso 1/2\"", brand: "Ferrum", emoji: "🔧", price: 1200, unit: "unidad", stock: "ok", stockText: "✓ Stock disponible", cat: "plomeria" },
  { id: 12, name: "Pintura Epoxi Piso Gris", brand: "Sherwin-Williams", emoji: "🎨", price: 8900, unit: "bidón 4L", stock: "ok", stockText: "✓ Stock disponible", cat: "pintura" },
];

const CATEGORIES = [
  { id: "todos", label: "Todos", emoji: "🔍" },
  { id: "cemento", label: "Cemento y Cal", emoji: "⚪" },
  { id: "hierro", label: "Hierro y Acero", emoji: "🔩" },
  { id: "ceramica", label: "Cerámicas", emoji: "🟦" },
  { id: "pintura", label: "Pinturas", emoji: "🎨" },
  { id: "plomeria", label: "Plomería", emoji: "🔧" },
  { id: "electricidad", label: "Electricidad", emoji: "⚡" },
  { id: "madera", label: "Madera", emoji: "🪵" },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("todos");
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [cartOpen, setCartOpen] = useState(false);

  const filtered = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchesCat = activeCat === "todos" || p.cat === activeCat;
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [search, activeCat]);

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const flete = subtotal >= 50000 ? "Gratis 🎉" : formatCurrency(3500);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev[product.id];
      return {
        ...prev,
        [product.id]: { ...product, qty: (existing?.qty ?? 0) + 1 },
      };
    });
  }

  function changeQty(id: number, delta: number) {
    setCart((prev) => {
      const item = prev[id];
      if (!item) return prev;
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: { ...item, qty: newQty } };
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Bar ────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#1A252F] shadow-lg px-6 py-3 flex items-center gap-4">
        <span className="text-xl font-extrabold text-white hidden sm:block">
          🏗 Obra<span className="text-accent-500">Ya</span>
        </span>

        {/* Search */}
        <div className="flex-1 max-w-lg mx-auto flex bg-white rounded-lg overflow-hidden shadow-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Buscar cemento, hierro, cerámicas..."
            className="flex-1 px-4 py-2.5 text-sm outline-none text-dark-800"
          />
          <button className="bg-navy-500 hover:bg-navy-600 text-white px-4 flex items-center gap-1.5 text-sm font-medium transition-colors">
            <Search className="w-4 h-4" />
            Buscar
          </button>
        </div>

        {/* Cart button */}
        <button
          onClick={() => setCartOpen(true)}
          className="relative flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden sm:inline">Carrito</span>
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent-500 text-dark-900 rounded-full text-[10px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Delivery Bar ───────────────────────────────────────────── */}
      <div className="bg-navy-500 text-white px-6 py-2 flex items-center gap-2 text-xs">
        <Truck className="w-3.5 h-3.5 shrink-0" />
        Entregando en <strong className="text-accent-500 mx-1">Buenos Aires, CABA</strong>
        · Entrega hoy en &lt;4 horas ·
        <strong className="text-accent-500 ml-1">Envío gratis</strong> en pedidos +$50.000
      </div>

      {/* ── Category Pills ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex gap-2 overflow-x-auto">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCat(c.id)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all",
              activeCat === c.id
                ? "bg-navy-500 text-white border-navy-500"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-navy-500 hover:text-navy-500"
            )}
          >
            <span>{c.emoji}</span> {c.label}
          </button>
        ))}
      </div>

      {/* ── Main ───────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="rounded-xl bg-gradient-to-br from-navy-500 to-[#1A252F] p-8 mb-8 flex justify-between items-center overflow-hidden relative">
          <div className="relative z-10">
            <h1 className="text-white font-extrabold text-2xl leading-snug mb-2">
              Materiales de construcción<br />
              <span className="text-accent-500">entregados hoy</span>
            </h1>
            <p className="text-blue-200 text-sm mb-5">
              Cemento, hierro, cerámicas y más, directo del fabricante a tu obra.
            </p>
            <button
              onClick={() => {
                document.getElementById("products-grid")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-accent-500 hover:bg-accent-600 text-dark-900 font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              Ver catálogo →
            </button>
          </div>
          <div className="hidden md:flex gap-8">
            {[
              { num: "+200", label: "Fabricantes" },
              { num: "+50K", label: "Productos" },
              { num: "<4 hs", label: "Entrega promedio" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <span className="block text-2xl font-extrabold text-accent-500">{s.num}</span>
                <span className="text-xs text-blue-200">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Promo Banner */}
        <div className="rounded-xl bg-gradient-to-r from-accent-500 to-orange-500 px-7 py-5 flex items-center justify-between mb-8">
          <div>
            <h3 className="text-white font-bold text-base">⚡ Oferta de la semana: Hierro para construcción</h3>
            <p className="text-white/85 text-sm mt-1">Hasta 15% off en varillas nervadas y mallas electrosoldadas. Stock limitado.</p>
          </div>
          <button
            onClick={() => setActiveCat("hierro")}
            className="shrink-0 bg-white text-dark-900 font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Ver oferta →
          </button>
        </div>

        {/* Products Grid */}
        <div id="products-grid">
          <div className="flex items-baseline gap-3 mb-4">
            <h2 className="text-lg font-bold text-dark-800">
              {activeCat === "todos" ? "🔥 Más vendidos" : CATEGORIES.find((c) => c.id === activeCat)?.label}
            </h2>
            <span className="text-xs text-gray-400">{filtered.length} productos</span>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-medium">No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((p) => {
                const inCart = cart[p.id]?.qty ?? 0;
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col overflow-hidden"
                  >
                    {/* Image placeholder */}
                    <div className="h-36 bg-gray-50 flex items-center justify-center text-5xl">
                      {p.emoji}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      {p.badge && (
                        <span
                          className={cn(
                            "inline-block self-start text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5",
                            p.badgeType === "promo"
                              ? "bg-yellow-50 text-yellow-700"
                              : "bg-navy-50 text-navy-500"
                          )}
                        >
                          {p.badge}
                        </span>
                      )}
                      <div className="font-bold text-sm text-dark-800 mb-0.5">{p.name}</div>
                      <div className="text-xs text-gray-400 mb-3">{p.brand}</div>
                      <div className="mt-auto">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-extrabold text-dark-800">
                            {formatCurrency(p.price)}
                          </span>
                          {p.oldPrice && (
                            <span className="text-xs text-gray-400 line-through">
                              {formatCurrency(p.oldPrice)}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 mb-1">por {p.unit}</div>
                        <div
                          className={cn(
                            "text-[11px] font-medium mb-3",
                            p.stock === "ok" ? "text-success-500" : "text-warning-500"
                          )}
                        >
                          {p.stockText}
                        </div>
                        <button
                          onClick={() => addToCart(p)}
                          className={cn(
                            "w-full py-2.5 rounded-lg text-sm font-semibold transition-colors",
                            inCart > 0
                              ? "bg-success-500 text-white"
                              : "bg-navy-500 hover:bg-navy-600 text-white"
                          )}
                        >
                          {inCart > 0 ? `✓ En carrito (${inCart})` : "+ Agregar al carrito"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Cart Sidebar ───────────────────────────────────────────── */}
      {cartOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex justify-end"
          onClick={(e) => e.target === e.currentTarget && setCartOpen(false)}
        >
          <div className="w-96 bg-white h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-dark-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Tu carrito
              </h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-4xl mb-3">🛒</div>
                  <p className="font-medium">Tu carrito está vacío</p>
                  <p className="text-sm mt-1">Agregá materiales para empezar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-100">
                      <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-2xl shrink-0">
                        {item.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-dark-800 truncate">{item.name}</div>
                        <div className="text-xs text-gray-400 mb-2">{item.brand}</div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => changeQty(item.id, -1)}
                            className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center hover:bg-navy-500 hover:text-white hover:border-navy-500 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-bold text-sm w-5 text-center">{item.qty}</span>
                          <button
                            onClick={() => changeQty(item.id, 1)}
                            className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center hover:bg-navy-500 hover:text-white hover:border-navy-500 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <span className="ml-auto font-bold text-sm">
                            {formatCurrency(item.price * item.qty)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="px-5 py-4 border-t border-gray-100">
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Flete estimado</span>
                  <span>{flete}</span>
                </div>
                <button className="w-full bg-navy-500 hover:bg-navy-600 text-white font-bold py-3.5 rounded-xl text-sm transition-colors">
                  Ir al checkout →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
