"use client";

import { useEffect, useState } from "react";
import { DollarSign, Truck, Star, Loader2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { deliveryApi } from "@/lib/api";

export default function DeliveryEarnings() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    deliveryApi.getEarnings()
      .then(setData)
      .catch(() => setError("No se pudieron cargar las ganancias"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-900/40 text-red-200 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      </div>
    );
  }

  const { totalDeliveries = 0, totalEarnings = 0, totalCommissions = 0, totalTips = 0, orders = [] } = data ?? {};
  const avgPerDelivery = totalDeliveries > 0 ? Math.round(totalEarnings / totalDeliveries) : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">💰 Mis Ganancias</h1>
        <p className="text-slate-300 mt-1">Resumen de todos tus ingresos por entregas</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: "Total acumulado",   value: formatCurrency(totalEarnings),    icon: DollarSign, color: "text-green-400" },
          { label: "Entregas realizadas", value: totalDeliveries.toString(),      icon: Truck,      color: "text-blue-400" },
          { label: "Comisiones (10%)",   value: formatCurrency(totalCommissions), icon: Star,       color: "text-yellow-400" },
          { label: "Promedio por entrega", value: formatCurrency(avgPerDelivery), icon: DollarSign, color: "text-purple-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20">
            <kpi.icon className={`w-5 h-5 ${kpi.color} mb-2`} />
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-sm text-slate-400 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Propinas */}
      {totalTips > 0 && (
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4 mb-6 flex items-center gap-4">
          <Star className="w-8 h-8 text-yellow-400 shrink-0" />
          <div>
            <p className="font-semibold text-yellow-400">Propinas recibidas</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalTips)}</p>
          </div>
        </div>
      )}

      {/* Order history */}
      {orders.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h3 className="font-semibold text-white">Historial de entregas</h3>
          </div>
          <div className="divide-y divide-white/10">
            {orders.map((order: any) => (
              <div key={order.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{order.orderNumber}</p>
                  <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString("es-AR")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">{formatCurrency(order.deliveryCommission)}</p>
                  {order.tip > 0 && (
                    <p className="text-xs text-yellow-400">+{formatCurrency(order.tip)} propina</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aún no tenés entregas completadas</p>
        </div>
      )}
    </div>
  );
}
