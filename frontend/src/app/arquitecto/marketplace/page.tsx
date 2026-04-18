"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, ShoppingCart, X, Plus, Minus, Truck, Loader2, Package } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { productsApi } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  brand: string;
  emoji: string;
  badge?: string;
  price: number;
  promoPrice?: number;
  isPromo: boolean;
  unit: string;
  stock: number;
  category: { name: string; slug: string; emoji: string };
  supplier: { name: string; rating: number };
}

interface CartItem extends Product {
  qty: number;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ArquitectoMarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("todos");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    productsApi.getAll().then((data) => {
      setProducts(data as Product[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Build category list from products
  const categories = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; emoji: string }>();
    products.forEach((p) => {
      if (p.category && !map.has(p.category.slug)) {
        map.set(p.category.slug, p.category);
      }
    });
    return [{ slug: "todos", name: "Todos", emoji: "🔍" }, ...Array.from(map.values())];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = activeCat === "todos" || p.category?.slug === activeCat;
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [products, search, activeCat]);

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const subtotal = cartItems.reduce((s, i) => s + (i.isPromo && i.promoPrice ? i.promoPrice : i.price) * i.qty, 0);
  const flete = subtotal >= 50000 ? "Gratis 🎉" : formatCurrency(3500);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev[product.id];
      return { ...prev, [product.id]: { ...product, qty: (existing?.qty ?? 0) + 1 } };
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

  const displayPrice = (p: Product) => p.isPromo && p.promoPrice ? p.promoPrice : p.price;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-dark-900 shadow-lg px-6 py-3 flex items-center gap-4">
        <h1 className="text-lg font-extrabold text-white hidden sm:block">Marketplace</h1>

        <div className="flex-1 max-w-lg mx-auto flex bg-white rounded-lg overflow-hidden shadow-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Buscar cemento, hierro, cerámicas..."
            className="flex-1 px-4 py-2.5 text-sm outline-none text-dark-800"
          />
          <div className="bg-brand-500 text-white px-4 flex items-center">
            <Search className="w-4 h-4" />
          </div>
        </div>

        <button
          onClick={() => setCartOpen(true)}
          className="relative flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="hidden sm:inline">Carrito</span>
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Delivery Bar ─────────────────────────────────────────────────── */}
      <div className="bg-dark-800 text-white px-6 py-2 flex items-center gap-2 text-xs">
        <Truck className="w-3.5 h-3.5 shrink-0" />
        Entregando en <strong className="text-brand-400 mx-1">Buenos Aires, CABA</strong>
        · Entrega hoy en &lt;4 horas ·
        <strong className="text-brand-400 ml-1">Envío gratis</strong> en pedidos +$50.000
      </div>

      {/* ── Category Pills ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex gap-2 overflow-x-auto">
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => setActiveCat(c.slug)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all",
              activeCat === c.slug
                ? "bg-dark-900 text-white border-dark-900"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-dark-900 hover:text-dark-900"
            )}
          >
            <span>{c.emoji}</span> {c.name}
          </button>
        ))}
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Banner */}
        <div className="rounded-2xl bg-gradient-to-br from-dark-900 to-dark-800 p-8 mb-8 flex justify-between items-center overflow-hidden relative">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-brand-500/20 text-brand-400 px-3 py-1 rounded-full text-xs font-bold mb-3">
              ⚡ Entrega en el día
            </div>
            <h2 className="text-white font-extrabold text-2xl leading-snug mb-2">
              Materiales directo<br />
              <span className="text-brand-400">a tu obra</span>
            </h2>
            <p className="text-gray-400 text-sm mb-5">
              Catálogo verificado de proveedores. Mejores precios garantizados.
            </p>
            <button
              onClick={() => document.getElementById("products-grid")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              Ver catálogo →
            </button>
          </div>
          <div className="hidden md:flex gap-8 relative z-10">
            {[
              { num: "+200", label: "Proveedores" },
              { num: "+50K", label: "Productos" },
              { num: "<4 hs", label: "Entrega" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <span className="block text-2xl font-extrabold text-brand-400">{s.num}</span>
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Promo Banner */}
        <div className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-7 py-5 flex items-center justify-between mb-8">
          <div>
            <h3 className="text-white font-bold text-base">⚡ Oferta de la semana</h3>
            <p className="text-white/85 text-sm mt-1">Hasta 15% off en materiales seleccionados. Stock limitado.</p>
          </div>
          <button
            onClick={() => setActiveCat("pintura-acabados")}
            className="shrink-0 bg-white text-dark-900 font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Ver ofertas →
          </button>
        </div>

        {/* Products Grid */}
        <div id="products-grid">
          <div className="flex items-baseline gap-3 mb-5">
            <h2 className="text-lg font-bold text-dark-800">
              {activeCat === "todos" ? "🔥 Todos los productos" : categories.find((c) => c.slug === activeCat)?.name}
            </h2>
            {!loading && <span className="text-xs text-gray-400">{filtered.length} productos</span>}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Cargando productos...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((p) => {
                const inCart = cart[p.id]?.qty ?? 0;
                const price = displayPrice(p);
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col overflow-hidden"
                  >
                    <div className="h-36 bg-gray-50 flex items-center justify-center text-5xl">
                      {p.emoji || "📦"}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      {p.isPromo && (
                        <span className="inline-block self-start text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 bg-brand-50 text-brand-600">
                          {p.badge || "Promo"}
                        </span>
                      )}
                      <div className="font-bold text-sm text-dark-800 mb-0.5 leading-snug">{p.name}</div>
                      <div className="text-xs text-gray-400 mb-1">{p.brand}</div>
                      <div className="text-[11px] text-gray-400 mb-3">{p.supplier?.name}</div>
                      <div className="mt-auto">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-extrabold text-dark-800">{formatCurrency(price)}</span>
                          {p.isPromo && p.promoPrice && (
                            <span className="text-xs text-gray-400 line-through">{formatCurrency(p.price)}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 mb-1">por {p.unit}</div>
                        <div className={cn("text-[11px] font-medium mb-3", p.stock > 10 ? "text-success-500" : p.stock > 0 ? "text-warning-500" : "text-danger-500")}>
                          {p.stock > 10 ? "✓ Stock disponible" : p.stock > 0 ? `⚠ Últimas ${p.stock} unidades` : "✗ Sin stock"}
                        </div>
                        <button
                          onClick={() => addToCart(p)}
                          disabled={p.stock === 0}
                          className={cn(
                            "w-full py-2.5 rounded-lg text-sm font-semibold transition-colors",
                            p.stock === 0
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : inCart > 0
                              ? "bg-success-500 text-white"
                              : "bg-dark-900 hover:bg-dark-800 text-white"
                          )}
                        >
                          {p.stock === 0 ? "Sin stock" : inCart > 0 ? `✓ En carrito (${inCart})` : "+ Agregar"}
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

      {/* ── Cart Sidebar ──────────────────────────────────────────────────── */}
      {cartOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex justify-end"
          onClick={(e) => e.target === e.currentTarget && setCartOpen(false)}
        >
          <div className="w-96 bg-white h-full flex flex-col shadow-2xl">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-dark-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Tu carrito
                {cartCount > 0 && <span className="text-xs text-gray-400 font-normal">({cartCount} items)</span>}
              </h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Tu carrito está vacío</p>
                  <p className="text-sm mt-1">Agregá materiales para empezar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => {
                    const price = displayPrice(item);
                    return (
                      <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-100">
                        <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center text-2xl shrink-0">
                          {item.emoji || "📦"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-dark-800 truncate">{item.name}</div>
                          <div className="text-xs text-gray-400 mb-2">{item.brand}</div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => changeQty(item.id, -1)}
                              className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center hover:bg-dark-900 hover:text-white hover:border-dark-900 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-bold text-sm w-5 text-center">{item.qty}</span>
                            <button
                              onClick={() => changeQty(item.id, 1)}
                              className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center hover:bg-dark-900 hover:text-white hover:border-dark-900 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <span className="ml-auto font-bold text-sm">{formatCurrency(price * item.qty)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

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
                <div className="bg-brand-50 rounded-lg p-3 mb-4 text-xs text-brand-700 font-medium">
                  {subtotal >= 50000 ? "🎉 ¡Tenés envío gratis!" : `Te faltan ${formatCurrency(50000 - subtotal)} para envío gratis`}
                </div>
                <button className="w-full bg-dark-900 hover:bg-dark-800 text-white font-bold py-3.5 rounded-xl text-sm transition-colors">
                  Confirmar pedido →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
