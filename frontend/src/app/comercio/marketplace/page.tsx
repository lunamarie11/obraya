"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, ShoppingCart, X, Plus, Minus, Truck, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { productsApi } from "@/lib/api";

interface CartItem {
  id: string;
  name: string;
  brand: string;
  emoji: string;
  price: number;
  unit: string;
  qty: number;
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("todos");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    productsApi.getAll()
      .then((data) => setProducts(data.filter((p: any) => p.isActive !== false)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Derive categories from loaded products
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const cats: { id: string; label: string }[] = [{ id: "todos", label: "Todos" }];
    for (const p of products) {
      const name = p.category?.name;
      if (name && !seen.has(name)) {
        seen.add(name);
        cats.push({ id: name, label: name });
      }
    }
    return cats;
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = activeCat === "todos" || p.category?.name === activeCat;
      const q = search.toLowerCase();
      const matchesSearch = !q || p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, search, activeCat]);

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const flete = subtotal >= 50000 ? "Gratis 🎉" : formatCurrency(3500);

  function addToCart(p: any) {
    setCart((prev) => {
      const existing = prev[p.id];
      return { ...prev, [p.id]: { id: p.id, name: p.name, brand: p.brand, emoji: p.emoji ?? "📦", price: p.price, unit: p.unit, qty: (existing?.qty ?? 0) + 1 } };
    });
  }

  function changeQty(id: string, delta: number) {
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
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-[#1A252F] shadow-lg px-6 py-3 flex items-center gap-4">
        <span className="text-xl font-extrabold text-white hidden sm:block">
          🏗 Obra<span className="text-yellow-400">Ya</span>
        </span>
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
        <button
          onClick={() => setCartOpen(true)}
          className="relative flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden sm:inline">Carrito</span>
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400 text-dark-900 rounded-full text-[10px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Delivery Bar */}
      <div className="bg-navy-500 text-white px-6 py-2 flex items-center gap-2 text-xs">
        <Truck className="w-3.5 h-3.5 shrink-0" />
        Entregando en <strong className="text-yellow-400 mx-1">Buenos Aires, CABA</strong>
        · Entrega hoy en &lt;4 horas ·
        <strong className="text-yellow-400 ml-1">Envío gratis</strong> en pedidos +$50.000
      </div>

      {/* Category Pills */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex gap-2 overflow-x-auto">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCat(c.id)}
            className={cn(
              "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all",
              activeCat === c.id
                ? "bg-navy-500 text-white border-navy-500"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-navy-500 hover:text-navy-500"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero */}
        <div className="rounded-xl bg-gradient-to-br from-navy-500 to-[#1A252F] p-8 mb-8 flex justify-between items-center overflow-hidden relative">
          <div className="relative z-10">
            <h1 className="text-white font-extrabold text-2xl leading-snug mb-2">
              Materiales de construcción<br />
              <span className="text-yellow-400">entregados hoy</span>
            </h1>
            <p className="text-blue-200 text-sm mb-5">
              Cemento, hierro, cerámicas y más, directo del fabricante a tu obra.
            </p>
            <button
              onClick={() => document.getElementById("products-grid")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-yellow-400 hover:bg-yellow-500 text-dark-900 font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              Ver catálogo →
            </button>
          </div>
          <div className="hidden md:flex gap-8">
            {[
              { num: "+200", label: "Fabricantes" },
              { num: `${products.length}`, label: "Productos" },
              { num: "<4 hs", label: "Entrega promedio" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <span className="block text-2xl font-extrabold text-yellow-400">{s.num}</span>
                <span className="text-xs text-blue-200">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Products grid */}
        <div id="products-grid">
          <div className="flex items-baseline gap-3 mb-4">
            <h2 className="text-lg font-bold text-dark-800">
              {activeCat === "todos" ? "🔥 Catálogo" : activeCat}
            </h2>
            <span className="text-xs text-gray-400">{filtered.length} productos</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-navy-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-medium">No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((p) => {
                const inCart = cart[p.id]?.qty ?? 0;
                const isLowStock = p.stock > 0 && p.stock < 20;
                const isOutOfStock = p.stock === 0;
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col overflow-hidden"
                  >
                    <div className="h-36 bg-gray-50 flex items-center justify-center text-5xl">
                      {p.emoji ?? "📦"}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      {p.isPromo && (
                        <span className="inline-block self-start text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 bg-yellow-50 text-yellow-700">
                          Promo
                        </span>
                      )}
                      <div className="font-bold text-sm text-dark-800 mb-0.5">{p.name}</div>
                      <div className="text-xs text-gray-400 mb-3">{p.brand}</div>
                      <div className="mt-auto">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-extrabold text-dark-800">{formatCurrency(p.price)}</span>
                          {p.proPrice && p.proPrice < p.price && (
                            <span className="text-[10px] text-info-500 font-semibold">Pro: {formatCurrency(p.proPrice)}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 mb-1">por {p.unit}</div>
                        <div className={cn("text-[11px] font-medium mb-3",
                          isOutOfStock ? "text-danger-500" : isLowStock ? "text-warning-500" : "text-success-500"
                        )}>
                          {isOutOfStock ? "✕ Sin stock" : isLowStock ? `⚠ Últimas ${p.stock} unidades` : "✓ Stock disponible"}
                        </div>
                        <button
                          disabled={isOutOfStock}
                          onClick={() => addToCart(p)}
                          className={cn(
                            "w-full py-2.5 rounded-lg text-sm font-semibold transition-colors",
                            isOutOfStock
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : inCart > 0
                                ? "bg-success-500 text-white"
                                : "bg-navy-500 hover:bg-navy-600 text-white"
                          )}
                        >
                          {isOutOfStock ? "Sin stock" : inCart > 0 ? `✓ En carrito (${inCart})` : "+ Agregar al carrito"}
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

      {/* Cart Sidebar */}
      {cartOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex justify-end"
          onClick={(e) => e.target === e.currentTarget && setCartOpen(false)}
        >
          <div className="w-96 bg-white h-full flex flex-col shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-dark-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Tu carrito
              </h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
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
                          <span className="ml-auto font-bold text-sm">{formatCurrency(item.price * item.qty)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="px-5 py-4 border-t border-gray-100">
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
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
