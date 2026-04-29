"use client";

import { useState, useEffect } from "react";
import {
  DollarSign, ShoppingCart, Package, TrendingUp,
  Users, ArrowUpRight, ArrowDownRight, BarChart3, Truck,
  AlertTriangle, CheckCircle2, Loader2,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { dashboardApi } from "@/lib/api";

type Period = "hoy" | "semana" | "mes" | "trimestre";

const PERIOD_MAP: Record<Period, string> = {
  hoy: "day",
  semana: "week",
  mes: "month",
  trimestre: "quarter",
};

function statusLabel(status: string) {
  switch (status) {
    case "PENDING":    return { label: "Pendiente",  color: "bg-warning-50 text-warning-500", dot: "bg-warning-500" };
    case "CONFIRMED":  return { label: "Confirmado", color: "bg-info-50 text-info-500",       dot: "bg-info-500" };
    case "PREPARING":  return { label: "En proceso", color: "bg-info-50 text-info-500",       dot: "bg-info-500" };
    case "IN_TRANSIT": return { label: "En camino",  color: "bg-navy-50 text-navy-500",       dot: "bg-navy-500" };
    case "DELIVERED":  return { label: "Completada", color: "bg-success-50 text-success-500", dot: "bg-success-500" };
    case "CANCELLED":  return { label: "Cancelado",  color: "bg-danger-50 text-danger-500",   dot: "bg-danger-500" };
    default:           return { label: status,        color: "bg-gray-50 text-gray-500",       dot: "bg-gray-400" };
  }
}

export default function ComercioDashboardPage() {
  const [period, setPeriod] = useState<Period>("mes");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    dashboardApi.getComercioStats(PERIOD_MAP[period])
      .then(setData)
      .catch(() => setError("No se pudieron cargar las métricas"))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-dark-800">📊 Dashboard de Ventas</h1>
          <p className="text-sm text-gray-500 mt-1">Métricas de rendimiento comercial en tiempo real</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1">
          {(["hoy", "semana", "mes", "trimestre"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all",
                period === p ? "bg-white text-dark-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-danger-50 text-danger-600 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-navy-500" />
        </div>
      )}

      {!loading && data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { icon: DollarSign, label: "Facturación",     value: formatCurrency(data.revenue),  change: null, bg: "bg-success-50", color: "text-success-500" },
              { icon: ShoppingCart, label: "Pedidos",        value: data.orders.toString(),         change: null, bg: "bg-info-50",    color: "text-info-500" },
              { icon: BarChart3, label: "Ticket promedio",   value: formatCurrency(data.avgTicket), change: null, bg: "bg-brand-50",   color: "text-brand-500" },
              { icon: Users, label: "Clientes únicos",       value: data.customers.toString(),      change: null, bg: "bg-navy-50",    color: "text-navy-500" },
            ].map((kpi) => (
              <div key={kpi.label} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", kpi.bg)}>
                    <kpi.icon className={cn("w-5 h-5", kpi.color)} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-dark-800">{kpi.value}</div>
                <div className="text-xs text-gray-400 mt-1">{kpi.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Recent Orders */}
            <div className="col-span-2 card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-sm text-dark-800">Pedidos recientes</h3>
                <span className="text-xs text-gray-400">{data.recentOrders.length} pedidos</span>
              </div>
              {data.recentOrders.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-gray-400">
                  No hay pedidos en este período
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="text-left px-5 py-2.5">Pedido</th>
                      <th className="text-right px-3 py-2.5">Ítems</th>
                      <th className="text-right px-3 py-2.5">Total</th>
                      <th className="text-center px-3 py-2.5">Estado</th>
                      <th className="text-right px-3 py-2.5">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.recentOrders.map((order: any) => {
                      const sc = statusLabel(order.status);
                      return (
                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 font-bold text-dark-800">{order.orderNumber}</td>
                          <td className="px-3 py-3 text-right text-gray-500">{order.itemCount}</td>
                          <td className="px-3 py-3 text-right font-bold text-dark-800">{formatCurrency(order.total)}</td>
                          <td className="px-3 py-3 text-center">
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold", sc.color)}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString("es-AR")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Top Products */}
            <div className="card p-5">
              <h3 className="font-bold text-sm text-dark-800 mb-3">Productos más vendidos</h3>
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sin datos para este período</p>
              ) : (
                <div className="space-y-3">
                  {data.topProducts.map((p: any, idx: number) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-300 w-4">{idx + 1}</span>
                      <span className="text-lg">{p.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-dark-800 truncate">{p.name}</div>
                        <div className="text-[10px] text-gray-400">{p.sold} vendidos</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-dark-800">{formatCurrency(p.revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
