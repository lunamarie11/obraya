"use client";

import { useState, useMemo } from "react";
import { Search, ShoppingCart, X, Plus, Minus, Truck, CreditCard, ShieldCheck } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { ordersApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

interface Product {
  id: number;
  name: string;
  brand: string;
  emoji: string;
  category: string;
  vendor: string;
  badge?: string;
  badgeType?: "promo" | "default";
  price: number;
  oldPrice?: number;
  unit: string;
  stock: "ok" | "low";
  stockText: string;
}

interface CartItem extends Product {
  qty: number;
}

const PRODUCTS: Product[] = [
  { id: 1, name: "Cemento Portland Normal", brand: "Loma Negra", emoji: "🪨", category: "cemento", vendor: "Fabricante", badge: "Más vendido", price: 6800, unit: "bolsa 50 kg", stock: "ok", stockText: "✓ Stock disponible" },
  { id: 2, name: "Varilla Nervada Ø12mm", brand: "Acindar", emoji: "🔩", category: "hierro", vendor: "Distribuidor", badge: "Promo", badgeType: "promo", price: 4200, oldPrice: 4900, unit: "barra 12m", stock: "ok", stockText: "✓ Stock disponible" },
  { id: 3, name: "Porcellanato 60×60 Gris", brand: "San Lorenzo", emoji: "🟦", category: "ceramica", vendor: "Ferretería", badge: "Destacado", price: 3800, unit: "caja 1.44m²", stock: "ok", stockText: "✓ Stock disponible" },
  { id: 4, name: "Pintura Látex Interior Blanco", brand: "Sherwin-Williams", emoji: "🎨", category: "pintura", vendor: "Distribuidor", badge: "Promo", badgeType: "promo", price: 12500, oldPrice: 14200, unit: "bidón 20L", stock: "low", stockText: "⚠ Últimas 8 unidades" },
  { id: 5, name: "Cal Hidráulica Premium", brand: "Calera Avellaneda", emoji: "⚪", category: "cemento", vendor: "Fabricante", price: 2800, unit: "bolsa 25 kg", stock: "ok", stockText: "✓ Stock disponible" },
  { id: 6, name: "Caño PVC 4\" Sanitario", brand: "Fiplasma", emoji: "🔧", category: "plomeria", vendor: "Ferretería", price: 1850, unit: "tramo 3m", stock: "ok", stockText: "✓ Stock disponible" },
  { id: 7, name: "Cable Unipolar 2.5mm IRAM", brand: "Prysmian", emoji: "⚡", category: "electricidad", vendor: "Distribuidor", badge: "Destacado", price: 980, unit: "rollo 100m", stock: "ok", stockText: "✓ Stock disponible" },
  { id: 8, name: "Malla Electrosoldada 15×15cm", brand: "Acindar", emoji: "🔩", category: "hierro", vendor: "Fabricante", badge: "Promo", badgeType: "promo", price: 8900, oldPrice: 10200, unit: "hoja 6×2.35m", stock: "ok", stockText: "✓ Stock disponible" },
  { id: 9, name: "Tablero 12 Circuitos", brand: "Schneider Electric", emoji: "⚡", category: "electricidad", vendor: "Ferretería", price: 18500, unit: "unidad", stock: "ok", stockText: "✓ Stock disponible" },
  { id: 10, name: "Parquet Flotante Roble", brand: "Bambu Floors", emoji: "🪵", category: "madera", vendor: "Distribuidor", price: 5200, unit: "caja 2.5m²", stock: "low", stockText: "⚠ Pocas unidades" },
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

const VENDORS = [
  { name: "Ferreterías urbanas", type: "Ferretería", description: "Entrega rápida en zonas urbanas con stock inmediato.", icon: "🔧" },
  { name: "Distribuidores industriales", type: "Distribuidor", description: "Ofertas para obra grande y volúmenes profesionales.", icon: "🏗️" },
  { name: "Fabricantes oficiales", type: "Fabricante", description: "Materiales directos de fábrica con entregas planificadas.", icon: "🏭" },
];

const PAYMENT_METHODS = [
  { id: "EFECTIVO", label: "Efectivo" },
  { id: "MERCADO_PAGO", label: "Mercado Pago" },
  { id: "TARJETA", label: "Tarjeta" },
];

export default function BuyerMarketplace() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("todos");
  const [cart, setCart] = useState<Record<number, CartItem>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesCat = activeCat === "todos" || product.category === activeCat;
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.brand.toLowerCase().includes(search.toLowerCase()) ||
        product.vendor.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [search, activeCat]);

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal >= 50000 ? 0 : 3500;
  const total = subtotal + shipping;

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
      const nextQty = item.qty + delta;
      if (nextQty <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: { ...item, qty: nextQty } };
    });
  }

  async function createOrder() {
    const user = getCurrentUser();
    if (!user) {
      setMessage("Inicia sesión para enviar tu pedido.");
      return;
    }
    if (cartItems.length === 0) {
      setMessage("Agrega productos al carrito antes de confirmar.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await ordersApi.create({
        userId: user.id,
        items: cartItems.map((item) => ({
          productId: String(item.id),
          qty: item.qty,
          price: item.price,
        })),
        paymentMethod,
        notes,
      });

      setCart({});
      setCheckoutOpen(false);
      setMessage("Tu pedido se envió correctamente y ya aparece en el módulo Delivery.");
    } catch (error: any) {
      setMessage(error?.message || "No se pudo procesar el pedido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Marketplace Buyer</h1>
            <p className="text-sm text-slate-500 mt-1">Compra materiales en ferreterías, distribuidores y fabricantes con pago en efectivo, Mercado Pago o tarjeta.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative w-full sm:w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cemento, hierro, ferreterías..."
                className="w-full border border-gray-200 rounded-full py-3 pl-10 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 text-white px-5 py-3 text-sm font-semibold shadow-sm hover:bg-brand-700 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" /> Carrito {cartCount > 0 ? `(${cartCount})` : ""}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="space-y-6">
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-6 text-white overflow-hidden shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-brand-300">Compra inteligente</p>
                <h2 className="mt-3 text-3xl font-extrabold">Todo el marketplace de materiales en un solo lugar.</h2>
                <p className="mt-4 max-w-2xl text-sm text-slate-300">Ferreterías, distribuidores y fabricantes a tu alcance. Agrega al carrito y paga con el medio que elijas.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Entrega en 4 hs", value: "Entrega rápida" },
                  { label: "Efectivo · Mercado Pago · Tarjeta", value: "Métodos de pago" },
                  { label: "Soporte 24/7", value: "Atención al cliente" },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                    <p className="mt-2 font-semibold text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-5 gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Encuentra proveedores</h2>
                <p className="text-sm text-slate-500">Selecciona por categoría o vendor para ver productos más rápido.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                <Truck className="w-4 h-4" /> Envío express
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCat(category.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition",
                    activeCat === category.id
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-gray-200 bg-white text-slate-600 hover:border-brand-400 hover:text-slate-900"
                  )}
                >
                  <span>{category.emoji}</span>
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {VENDORS.map((vendor) => (
              <div key={vendor.name} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 text-xl">
                    {vendor.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{vendor.type}</p>
                    <p className="text-xs text-slate-500">{vendor.name}</p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-slate-500">{vendor.description}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Resultados</h2>
              <p className="text-sm text-slate-500">{filtered.length} productos</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => {
                const inCart = cart[product.id]?.qty ?? 0;
                return (
                  <div key={product.id} className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden transition hover:shadow-md">
                    <div className="h-36 bg-slate-100 flex items-center justify-center text-5xl">{product.emoji}</div>
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.vendor} · {product.brand}</p>
                        </div>
                        {product.badge && (
                          <span className={cn(
                            "rounded-full px-2 py-1 text-[11px] font-semibold",
                            product.badgeType === "promo"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                          )}>
                            {product.badge}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-500">{product.unit}</p>
                        <p className="font-bold text-slate-900">{formatCurrency(product.price)}</p>
                        <p className={cn("text-xs font-semibold", product.stock === "ok" ? "text-emerald-600" : "text-amber-600")}>{product.stockText}</p>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className={cn(
                          "w-full rounded-2xl py-3 text-sm font-semibold transition",
                          inCart > 0 ? "bg-emerald-500 text-white" : "bg-brand-600 text-white hover:bg-brand-700"
                        )}
                      >
                        {inCart > 0 ? `✓ En carrito (${inCart})` : "+ Agregar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-2xl bg-brand-100 p-3 text-brand-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Pago seguro</p>
                <p className="text-sm text-slate-500">Efectivo, Mercado Pago y tarjeta con un solo click.</p>
              </div>
            </div>
            <div className="grid gap-3">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">Métodos de pago</span>
                <p className="mt-2">Elegí efectivo, cuenta de Mercado Pago o tarjeta al momento de finalizar.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">Pedidos Ya</span>
                <p className="mt-2">Configura tus preferencias de entrega rápidas y direcciones guardadas.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Carrito rápido</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <p>Tu compra llega directo al módulo Delivery.</p>
              <p>Flete gratis en pedidos mayores a $50.000.</p>
              <p>Podés pagar con tarjeta, Mercado Pago o en efectivo al recibir.</p>
            </div>
          </div>
        </aside>
      </div>

      {cartOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm px-4 py-6 sm:px-6"
          onClick={(event) => event.target === event.currentTarget && setCartOpen(false)}
        >
          <div className="mx-auto max-w-3xl h-full overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Tu carrito</h2>
                <p className="text-sm text-slate-500">{cartCount} producto{cartCount === 1 ? "" : "s"} en el carrito</p>
              </div>
              <button onClick={() => setCartOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] h-[calc(100%-100px)]">
              <div className="overflow-y-auto px-6 py-5">
                {cartItems.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-500">
                    <div className="text-5xl">🛒</div>
                    <p className="text-lg font-semibold text-slate-900">Tu carrito está vacío</p>
                    <p className="max-w-sm text-sm">Agrega materiales, ferreterías o distribuidores y prepárate para finalizar tu compra.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="rounded-3xl border border-gray-200 bg-slate-50 p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-3xl">{item.emoji}</div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900">{item.name}</p>
                            <p className="text-sm text-slate-500">{item.vendor} · {item.brand}</p>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                              <span className="rounded-full bg-white px-3 py-1 text-slate-600">{item.qty} unidad{item.qty === 1 ? "" : "es"}</span>
                              <span className="rounded-full bg-white px-3 py-1 text-slate-600">{item.unit}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">{formatCurrency(item.price * item.qty)}</p>
                            <div className="mt-3 flex items-center justify-end gap-2">
                              <button onClick={() => changeQty(item.id, -1)} className="h-9 w-9 rounded-2xl border border-gray-200 bg-white text-slate-700 hover:bg-brand-600 hover:text-white transition-colors">-</button>
                              <button onClick={() => changeQty(item.id, 1)} className="h-9 w-9 rounded-2xl border border-gray-200 bg-white text-slate-700 hover:bg-brand-600 hover:text-white transition-colors">+</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-l border-gray-200 bg-slate-900 text-white p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Resumen</p>
                    <p className="mt-2 text-3xl font-bold">{formatCurrency(total)}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-800 p-4 text-sm text-slate-300">
                    <p>Subtotal: {formatCurrency(subtotal)}</p>
                    <p>Envío: {shipping === 0 ? "Gratis" : formatCurrency(shipping)}</p>
                    <p className="mt-2 font-semibold">Total a pagar: {formatCurrency(total)}</p>
                  </div>
                  <button
                    onClick={() => setCheckoutOpen(true)}
                    disabled={cartItems.length === 0}
                    className="w-full rounded-3xl bg-brand-500 py-3 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-slate-700"
                  >
                    Finalizar compra
                  </button>
                  {message && (
                    <div className="rounded-3xl bg-white/10 p-4 text-sm text-slate-200">{message}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm px-4 py-6 sm:px-6"
          onClick={(event) => event.target === event.currentTarget && setCheckoutOpen(false)}
        >
          <div className="mx-auto max-w-2xl overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Confirmar pedido</h2>
                <p className="text-sm text-slate-500">Selecciona el método de pago y envía tu orden al módulo Delivery.</p>
              </div>
              <button onClick={() => setCheckoutOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-6 p-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={cn(
                      "rounded-3xl border p-4 text-left transition",
                      paymentMethod === method.id
                        ? "border-brand-500 bg-brand-50 text-slate-900"
                        : "border-gray-200 bg-white text-slate-600 hover:border-brand-300"
                    )}
                  >
                    <div className="text-sm font-semibold">{method.label}</div>
                    <p className="text-xs text-slate-500 mt-1">{method.id === "EFECTIVO" ? "Pago contra entrega" : method.id === "MERCADO_PAGO" ? "Link de pago" : "Tarjeta de crédito/débito"}.</p>
                  </button>
                ))}
              </div>

              <div className="rounded-3xl border border-gray-200 bg-slate-50 p-4">
                <label className="text-sm font-semibold text-slate-900">Notas para el pedido</label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  placeholder="Ej. Enviar a portón verde, sin timbre."
                  className="mt-3 w-full resize-none rounded-3xl border border-gray-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <div className="rounded-3xl border border-gray-200 p-4 bg-slate-50 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Resumen de pago</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span>Envío</span>
                  <span>{shipping === 0 ? "Gratis" : formatCurrency(shipping)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <button
                onClick={createOrder}
                disabled={loading}
                className="w-full rounded-3xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Procesando pedido..." : "Enviar pedido a Delivery"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
