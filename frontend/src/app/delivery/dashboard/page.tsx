"use client";

import { useEffect, useState } from "react";
import { Package, Truck, DollarSign, Star, Loader2, AlertTriangle } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { deliveryApi } from "@/lib/api";
import Link from "next/link";

export default function DeliveryDashboard() {
  const [earnings, setEarnings] = useState<any>(null);
  const [available, setAvailable] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      deliveryApi.getEarnings(),
      deliveryApi.getAvailableOrders(),
    ])
      .then(([e, orders]) => {
        setEarnings(e);
        setAvailable(orders.length);
      })
      .catch(() => setError("No se pudieron cargar los datos"))
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

  const todayRevenue = earnings?.totalEarnings ?? 0;
  const totalDeliveries = earnings?.totalDeliveries ?? 0;
  const totalCommissions = earnings?.totalCommissions ?? 0;
  const totalTips = earnings?.totalTips ?? 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">🚚 Panel del Repartidor</h1>
        <p className="text-slate-300 mt-1">Tu resumen de actividad y ganancias</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Package, label: "Disponibles ahora", value: available.toString(), color: "text-yellow-400", bg: "bg-yellow-400/10", link: "/delivery/available" },
          { icon: Truck, label: "Entregas completadas", value: totalDeliveries.toString(), color: "text-blue-400", bg: "bg-blue-400/10", link: "/delivery/completed" },
          { icon: DollarSign, label: "Ganancias totales", value: formatCurrency(todayRevenue), color: "text-green-400", bg: "bg-green-400/10", link: "/delivery/earnings" },
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.link}>
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-xl border border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", kpi.bg)}>
                <kpi.icon className={cn("w-5 h-5", kpi.color)} />
              </div>
              <div className={cn("text-2xl font-bold", kpi.color)}>{kpi.value}</div>
              <div className="text-sm text-slate-300 mt-1">{kpi.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Earnings breakdown */}
      <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 mb-6">
        <h3 className="font-semibold text-white mb-4">Desglose de ingresos</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-slate-400">Comisiones (10%)</p>
            <p className="text-xl font-bold text-green-400 mt-1">{formatCurrency(totalCommissions)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Propinas recibidas</p>
            <p className="text-xl font-bold text-yellow-400 mt-1">{formatCurrency(totalTips)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Total acumulado</p>
            <p className="text-xl font-bold text-white mt-1">{formatCurrency(todayRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      {available > 0 && (
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-yellow-400">⚡ Hay {available} pedido{available > 1 ? "s" : ""} disponible{available > 1 ? "s" : ""}</p>
            <p className="text-sm text-slate-300 mt-1">Aceptá uno y empezá a ganar</p>
          </div>
          <Link href="/delivery/available">
            <button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors">
              Ver pedidos →
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
