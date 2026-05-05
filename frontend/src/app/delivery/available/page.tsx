"use client";

import { useEffect, useState } from "react";
import { deliveryApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Loader2, MapPin, Package, CheckCircle2 } from "lucide-react";

export default function DeliveryAvailable() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    deliveryApi.getAvailableOrders()
      .then(setOrders)
      .catch((err) => setError(err.message || "No se pudieron cargar los pedidos."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleAccept(orderId: string) {
    setAccepting(orderId);
    try {
      await deliveryApi.acceptOrder(orderId);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err: any) {
      setError(err.message || "No se pudo aceptar el pedido.");
    } finally {
      setAccepting(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-3xl bg-slate-900/90 p-6 shadow-xl border border-white/10">
          <h1 className="text-3xl font-bold">Pedidos disponibles</h1>
          <p className="mt-2 text-sm text-slate-300">
            Acepta pedidos nuevos que llegan desde el módulo Buyer.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-500/10 px-5 py-3 border border-rose-400/20 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl bg-slate-900/90 p-12 border border-white/10 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <p className="text-xl font-semibold text-white">No hay pedidos pendientes por ahora.</p>
            <p className="mt-2 text-sm text-slate-400">Los nuevos pedidos de Buyer aparecerán aquí automáticamente.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {orders.map((order) => (
              <div key={order.id} className="rounded-3xl bg-slate-900/90 p-6 shadow-sm border border-white/10">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-widest text-slate-400">
                      Pedido #{order.orderNumber ?? order.id.slice(0, 8)}
                    </p>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Package className="w-5 h-5 text-amber-400" />
                      {order.items?.length ?? 0} artículo{(order.items?.length ?? 0) === 1 ? "" : "s"}
                    </h2>
                    {order.address && (
                      <p className="text-sm text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        {order.address.street}, {order.address.city}
                      </p>
                    )}
                    <p className="text-sm text-slate-400">
                      Pago: {order.paymentMethod === "EFECTIVO" ? "Efectivo" : order.paymentMethod === "MERCADO_PAGO" ? "Mercado Pago" : "Tarjeta"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400">Total</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-0.5">{formatCurrency(order.total ?? 0)}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleAccept(order.id)}
                    disabled={accepting === order.id}
                    className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 transition"
                  >
                    {accepting === order.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <CheckCircle2 className="w-4 h-4" />
                    }
                    {accepting === order.id ? "Aceptando…" : "Aceptar pedido"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
