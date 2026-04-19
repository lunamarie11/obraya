"use client";

import { useEffect, useState } from "react";
import { ordersApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-sky-100 text-sky-800",
  PREPARING: "bg-indigo-100 text-indigo-800",
  IN_TRANSIT: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-800",
};

export default function BuyerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setError("Debes iniciar sesión para ver tus pedidos.");
      setLoading(false);
      return;
    }

    ordersApi
      .getAll(user.id)
      .then((data) => setOrders(data))
      .catch((err) => setError(err.message || "No se pudo cargar tus pedidos."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
          <h1 className="text-3xl font-bold text-slate-900">Mis pedidos</h1>
          <p className="mt-2 text-sm text-slate-500">Revisa el estado de tus compras y el historial de entregas.</p>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-200 text-center text-slate-500">
            Cargando pedidos...
          </div>
        ) : error ? (
          <div className="rounded-3xl bg-rose-50 p-8 shadow-sm border border-rose-200 text-center text-rose-700">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-200 text-center">
            <p className="text-xl font-semibold text-slate-900">No tienes pedidos aún</p>
            <p className="mt-2 text-sm text-slate-500">Regresa al marketplace y agrega materiales al carrito para crear tu primer pedido.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {orders.map((order) => (
              <div key={order.id} className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Pedido {order.orderNumber || order.id}</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">{order.items?.length || 0} artículo{order.items?.length === 1 ? "" : "s"}</h2>
                    <p className="mt-1 text-sm text-slate-500">{order.address?.street || "Dirección no registrada"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={STATUS_STYLES[order.status] ?? "bg-slate-100 text-slate-700"}>
                      <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold">{order.status.replace("_", " ")}</span>
                    </span>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Total</p>
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(order.total)}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pago</p>
                    <p className="mt-2 text-sm text-slate-700">{order.paymentMethod || "Por definir"}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Creado</p>
                    <p className="mt-2 text-sm text-slate-700">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                {order.notes && (
                  <div className="mt-6 rounded-3xl bg-brand-50 p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">Notas del pedido</p>
                    <p className="mt-2">{order.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
