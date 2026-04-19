"use client";

import { useEffect, useState } from "react";
import { ordersApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function DeliveryAvailable() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ordersApi
      .getAll()
      .then((data) => setOrders(data.filter((order) => order.status === "PENDING")))
      .catch((err) => setError(err.message || "No se pudieron cargar los pedidos."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-3xl bg-slate-900/90 p-6 shadow-xl border border-white/10">
          <h1 className="text-3xl font-bold">Pedidos disponibles</h1>
          <p className="mt-2 text-sm text-slate-300">Acepta pedidos nuevos que llegan desde el módulo Buyer.</p>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-slate-900/90 p-8 shadow-sm border border-white/10 text-center text-slate-300">Cargando pedidos disponibles...</div>
        ) : error ? (
          <div className="rounded-3xl bg-rose-500/10 p-8 shadow-sm border border-rose-400/20 text-center text-rose-200">{error}</div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl bg-slate-900/90 p-8 shadow-sm border border-white/10 text-center text-slate-300">
            <p className="text-xl font-semibold text-white">No hay pedidos pendientes por ahora.</p>
            <p className="mt-2 text-sm text-slate-400">Los pedidos de Buyer aparecerán aquí tan pronto como sean creados.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {orders.map((order) => (
              <div key={order.id} className="rounded-3xl bg-slate-900/90 p-6 shadow-sm border border-white/10">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Pedido {order.orderNumber || order.id}</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">{order.items?.length || 0} artículo{order.items?.length === 1 ? "" : "s"}</h2>
                    <p className="mt-2 text-sm text-slate-300">{order.address?.street || "Dirección sin definida"}</p>
                    <p className="mt-1 text-sm text-slate-300">Pago: {order.paymentMethod || "Efectivo"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Total</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-400">{formatCurrency(order.total)}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition">Aceptar pedido</button>
                  <button className="rounded-3xl bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition">Ver detalles</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
