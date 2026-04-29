"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package, Clock, CheckCircle, Truck, ChevronRight,
  Loader2, AlertTriangle, RefreshCw,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { ordersApi } from "@/lib/api";

type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  PENDING:    { label: "Pendiente",    color: "text-warning-500", bg: "bg-warning-50" },
  CONFIRMED:  { label: "Confirmado",   color: "text-info-500",    bg: "bg-info-50" },
  PREPARING:  { label: "En preparación", color: "text-info-500", bg: "bg-info-50" },
  IN_TRANSIT: { label: "En camino",    color: "text-navy-500",    bg: "bg-navy-50" },
  DELIVERED:  { label: "Entregado",    color: "text-success-500", bg: "bg-success-50" },
  CANCELLED:  { label: "Cancelado",    color: "text-danger-500",  bg: "bg-danger-50" },
};

const STATUS_STEPS: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "IN_TRANSIT", "DELIVERED"];

const STEP_LABELS: Record<OrderStatus, string> = {
  PENDING:    "Pedido recibido",
  CONFIRMED:  "Pago confirmado",
  PREPARING:  "En preparación",
  IN_TRANSIT: "En camino",
  DELIVERED:  "Entregado",
  CANCELLED:  "Cancelado",
};

const NEXT_STATUS: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  PENDING:    { next: "CONFIRMED",  label: "✓ Confirmar pedido" },
  CONFIRMED:  { next: "PREPARING", label: "📦 Iniciar preparación" },
  PREPARING:  { next: "IN_TRANSIT", label: "🚚 Marcar en camino" },
  IN_TRANSIT: { next: "DELIVERED",  label: "✅ Marcar entregado" },
};

function orderItemsSummary(items: any[]): string {
  if (!items?.length) return "Sin ítems";
  return items
    .map((i) => `${i.product?.emoji ?? "📦"} ${i.product?.name ?? "Producto"} ×${i.qty}`)
    .join(", ");
}

function stepIndexOf(status: OrderStatus): number {
  return STATUS_STEPS.indexOf(status);
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [tracking, setTracking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ordersApi.getAll();
      setOrders(data);
      if (data.length > 0 && !selected) {
        setSelected(data[0]);
      }
    } catch {
      setError("No se pudieron cargar los pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    if (!selected) return;
    setTrackingLoading(true);
    ordersApi.getTracking(selected.id)
      .then(setTracking)
      .catch(() => setTracking([]))
      .finally(() => setTrackingLoading(false));
  }, [selected?.id]);

  async function handleStatusUpdate() {
    if (!selected) return;
    const next = NEXT_STATUS[selected.status as OrderStatus];
    if (!next) return;
    setUpdating(true);
    try {
      await ordersApi.updateStatus(selected.id, next.next);
      const updated = await ordersApi.getOne(selected.id);
      setSelected(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o)));
    } catch {
      // silent — user can retry
    } finally {
      setUpdating(false);
    }
  }

  const currentStepIdx = selected ? stepIndexOf(selected.status as OrderStatus) : -1;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-dark-800">📦 Pedidos</h1>
          <p className="text-sm text-gray-500 mt-1">Gestioná y seguí el estado de tus pedidos</p>
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-dark-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-danger-50 text-danger-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-navy-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay pedidos aún</p>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-6 max-w-5xl">
          {/* Orders list */}
          <div className="col-span-2 space-y-3">
            {orders.map((order) => {
              const st = STATUS_CONFIG[order.status as OrderStatus] ?? STATUS_CONFIG.PENDING;
              const isSelected = selected?.id === order.id;
              return (
                <button
                  key={order.id}
                  onClick={() => setSelected(order)}
                  className={cn(
                    "w-full text-left card p-4 transition-all",
                    isSelected ? "border-navy-500 ring-1 ring-navy-500" : "hover:border-gray-200"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-mono">#{order.orderNumber}</span>
                    <ChevronRight className={cn("w-4 h-4 text-gray-300", isSelected && "text-navy-500")} />
                  </div>
                  <div className="text-sm font-semibold text-dark-800 mb-1 truncate">
                    {orderItemsSummary(order.items)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("es-AR")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{formatCurrency(order.total)}</span>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", st.color, st.bg)}>
                        {st.label}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tracking detail */}
          {selected && (
            <div className="col-span-3 card p-6">
              <div className="text-xs text-gray-400 font-mono mb-1">Pedido #{selected.orderNumber}</div>
              <div className="font-bold text-lg text-dark-800 mb-1">
                {orderItemsSummary(selected.items)}
              </div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-sm font-bold text-dark-800">{formatCurrency(selected.total)}</span>
                {selected.user?.name && (
                  <span className="text-xs text-gray-400">· {selected.user.name}</span>
                )}
              </div>

              {/* Stepper */}
              {trackingLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-0 mb-6">
                  {STATUS_STEPS.map((stepStatus, i) => {
                    if (selected.status === "CANCELLED" && stepStatus !== "CANCELLED") return null;
                    const stepIdx = i;
                    const isDone = currentStepIdx > stepIdx;
                    const isCurrent = currentStepIdx === stepIdx;
                    const isLast = i === STATUS_STEPS.length - 1;

                    // Find matching tracking event
                    const event = tracking.find((t) => t.status === stepStatus);

                    return (
                      <div key={stepStatus} className="flex gap-4 pb-6 relative">
                        {!isLast && (
                          <div
                            className={cn(
                              "absolute left-[15px] top-8 w-0.5 h-full",
                              isDone ? "bg-success-500" : "bg-gray-200"
                            )}
                          />
                        )}
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold z-10",
                            isDone
                              ? "bg-success-500 text-white"
                              : isCurrent
                                ? "bg-navy-500 text-white animate-pulse"
                                : "bg-gray-100 text-gray-400"
                          )}
                        >
                          {isDone ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : isCurrent ? (
                            <Truck className="w-4 h-4" />
                          ) : (
                            <span>{i + 1}</span>
                          )}
                        </div>
                        <div className="pt-0.5">
                          <h4
                            className={cn(
                              "text-sm font-semibold",
                              !isDone && !isCurrent ? "text-gray-400" : "text-dark-800"
                            )}
                          >
                            {STEP_LABELS[stepStatus]}
                          </h4>
                          {event ? (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {event.message} · {new Date(event.createdAt).toLocaleString("es-AR")}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-300 mt-0.5">Pendiente</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {selected.status === "CANCELLED" && (
                    <div className="flex gap-4 pb-6">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-danger-50 text-danger-500 font-bold z-10">
                        ✕
                      </div>
                      <div className="pt-0.5">
                        <h4 className="text-sm font-semibold text-danger-500">Cancelado</h4>
                        {tracking.find((t) => t.status === "CANCELLED") && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(tracking.find((t) => t.status === "CANCELLED").createdAt).toLocaleString("es-AR")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action button */}
              {NEXT_STATUS[selected.status as OrderStatus] && (
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating}
                  className="w-full bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-sm font-bold px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    NEXT_STATUS[selected.status as OrderStatus]!.label
                  )}
                </button>
              )}

              {selected.status === "DELIVERED" && (
                <div className="flex items-center gap-4 bg-success-50 border border-success-500/20 rounded-xl p-4">
                  <Package className="w-8 h-8 text-success-500 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-success-500">¡Pedido entregado con éxito!</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {new Date(selected.createdAt).toLocaleDateString("es-AR")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
