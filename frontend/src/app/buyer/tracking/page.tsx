"use client";

import { useEffect, useMemo, useState } from "react";
import { ordersApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";

const ORDER_STAGES = [
  { key: "PENDING", label: "Pedido recibido" },
  { key: "CONFIRMED", label: "Pago confirmado" },
  { key: "PREPARING", label: "Preparando pedido" },
  { key: "IN_TRANSIT", label: "En camino" },
  { key: "DELIVERED", label: "Entregado" },
];

export default function BuyerTracking() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setError("Debes iniciar sesión para ver el seguimiento.");
      setLoading(false);
      return;
    }

    ordersApi
      .getAll(user.id)
      .then((data) => setOrders(data))
      .catch((err) => setError(err.message || "No se pudo cargar el seguimiento."))
      .finally(() => setLoading(false));
  }, []);

  const activeOrder = useMemo(() => {
    return orders.find((order) => order.status !== "DELIVERED" && order.status !== "CANCELLED") || orders[0];
  }, [orders]);

  const stageIndex = activeOrder ? ORDER_STAGES.findIndex((stage) => stage.key === activeOrder.status) : -1;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
          <h1 className="text-3xl font-bold text-slate-900">Seguimiento de pedidos</h1>
          <p className="mt-2 text-sm text-slate-500">Consulta el estado actual de tu pedido y su ruta de entrega.</p>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-200 text-center text-slate-500">Cargando seguimiento...</div>
        ) : error ? (
          <div className="rounded-3xl bg-rose-50 p-8 shadow-sm border border-rose-200 text-center text-rose-700">{error}</div>
        ) : !activeOrder ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-gray-200 text-center">
            <p className="text-xl font-semibold text-slate-900">No se encontró ningún pedido activo</p>
            <p className="mt-2 text-sm text-slate-500">Primero realiza una compra en el marketplace para recibir el seguimiento.</p>
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Pedido {activeOrder.orderNumber || activeOrder.id}</p>
                <h2 className="text-2xl font-semibold text-slate-900">{activeOrder.items?.length || 0} artículo{activeOrder.items?.length === 1 ? "" : "s"}</h2>
              </div>
              <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                {activeOrder.status.replace("_", " ")}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(activeOrder.total)}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pago</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{activeOrder.paymentMethod || "Efectivo"}</p>
                </div>
              </div>

              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Dirección de entrega</p>
                <p className="mt-2 text-sm text-slate-700">{activeOrder.address?.street || "No definida"}</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {ORDER_STAGES.map((stage, index) => {
                const completed = index <= stageIndex;
                return (
                  <div key={stage.key} className="flex items-start gap-4">
                    <div className={completed ? "mt-1 h-3 w-3 rounded-full bg-emerald-500" : "mt-1 h-3 w-3 rounded-full bg-slate-300"} />
                    <div>
                      <p className={completed ? "font-semibold text-slate-900" : "font-semibold text-slate-500"}>{stage.label}</p>
                      <p className="text-sm text-slate-500">{completed ? "Completado" : "Próximo paso"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
