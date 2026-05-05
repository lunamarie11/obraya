"use client";

import { useEffect, useState, useMemo } from "react";
import { Download, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { adminApi } from "@/lib/api";

type Range = "week" | "month" | "quarter" | "year";

const RANGE_LABELS: Record<Range, string> = {
  week: "Última Semana",
  month: "Último Mes",
  quarter: "Último Trimestre",
  year: "Último Año",
};

function getMonthName(date: Date): string {
  return date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

function filterByRange(orders: any[], range: Range): any[] {
  const now = new Date();
  const cutoff = new Date(now);
  if (range === "week") cutoff.setDate(now.getDate() - 7);
  else if (range === "month") cutoff.setMonth(now.getMonth() - 1);
  else if (range === "quarter") cutoff.setMonth(now.getMonth() - 3);
  else cutoff.setFullYear(now.getFullYear() - 1);
  return orders.filter((o) => new Date(o.createdAt) >= cutoff);
}

export default function AdminReportes() {
  const [range, setRange] = useState<Range>("month");
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getAllOrders({ limit: 1000 }),
      adminApi.getDashboardStats(),
    ])
      .then(([o, s]) => {
        setAllOrders(o.orders ?? o ?? []);
        setStats(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const orders = useMemo(() => filterByRange(allOrders, range), [allOrders, range]);

  const delivered = useMemo(() => orders.filter((o) => o.status === "DELIVERED"), [orders]);
  const cancelled = useMemo(() => orders.filter((o) => o.status === "CANCELLED"), [orders]);

  const totalRevenue = delivered.reduce((s, o) => s + (o.total ?? 0), 0);
  const totalOrders = orders.length;
  const completedCount = delivered.length;
  const conversionRate = totalOrders > 0 ? ((completedCount / totalOrders) * 100).toFixed(1) : "0.0";
  const avgOrder = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0;

  // Previous period for trend arrows (compare with same length period before)
  const prevRevenue = useMemo(() => {
    const now = new Date();
    const from = new Date(now);
    const to = new Date(now);
    if (range === "week") { from.setDate(now.getDate() - 14); to.setDate(now.getDate() - 7); }
    else if (range === "month") { from.setMonth(now.getMonth() - 2); to.setMonth(now.getMonth() - 1); }
    else if (range === "quarter") { from.setMonth(now.getMonth() - 6); to.setMonth(now.getMonth() - 3); }
    else { from.setFullYear(now.getFullYear() - 2); to.setFullYear(now.getFullYear() - 1); }
    return allOrders
      .filter((o) => o.status === "DELIVERED" && new Date(o.createdAt) >= from && new Date(o.createdAt) < to)
      .reduce((s, o) => s + (o.total ?? 0), 0);
  }, [allOrders, range]);

  function trendPct(current: number, prev: number): number {
    if (prev === 0) return current > 0 ? 100 : 0;
    return parseFloat((((current - prev) / prev) * 100).toFixed(1));
  }

  const revenueTrend = trendPct(totalRevenue, prevRevenue);

  const kpis = [
    { label: "Ingresos Totales", value: formatCurrency(totalRevenue), change: revenueTrend },
    { label: "Órdenes Completadas", value: completedCount.toString(), change: 0 },
    { label: "Tasa de Conversión", value: `${conversionRate}%`, change: 0 },
    { label: "Orden Promedio", value: formatCurrency(avgOrder), change: 0 },
  ];

  // Monthly breakdown (last 6 months)
  const monthlyData = useMemo(() => {
    const months: Record<string, { revenue: number; orders: number; delivered: number }> = {};
    allOrders.forEach((o) => {
      const key = getMonthName(new Date(o.createdAt));
      if (!months[key]) months[key] = { revenue: 0, orders: 0, delivered: 0 };
      months[key].orders += 1;
      if (o.status === "DELIVERED") {
        months[key].revenue += o.total ?? 0;
        months[key].delivered += 1;
      }
    });
    return Object.entries(months)
      .slice(-6)
      .map(([date, v]) => ({ date, ...v }));
  }, [allOrders]);

  // Top comercios by revenue
  const topComercios = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; orders: number }> = {};
    delivered.forEach((o) => {
      const id = o.comercioId ?? o.userId ?? "unknown";
      const name = o.comercioName ?? o.comercio?.name ?? o.vendorName ?? `Comercio ${id.slice(0, 6)}`;
      if (!map[id]) map[id] = { name, revenue: 0, orders: 0 };
      map[id].revenue += o.total ?? 0;
      map[id].orders += 1;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [delivered]);

  // Top buyers by spend
  const topBuyers = useMemo(() => {
    const map: Record<string, { name: string; spent: number; orders: number }> = {};
    delivered.forEach((o) => {
      const id = o.userId ?? "unknown";
      const name = o.userName ?? o.user?.name ?? `Usuario ${id.slice(0, 6)}`;
      if (!map[id]) map[id] = { name, spent: 0, orders: 0 };
      map[id].spent += o.total ?? 0;
      map[id].orders += 1;
    });
    return Object.values(map).sort((a, b) => b.spent - a.spent).slice(0, 5);
  }, [delivered]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Reportes</h1>
            <p className="mt-1 text-sm text-slate-500">
              Análisis operacional · {totalOrders} órdenes en el período
            </p>
          </div>
          <button
            onClick={() => {
              const rows = [
                ["Período", "Ingresos", "Órdenes", "Entregadas"],
                ...monthlyData.map((m) => [m.date, m.revenue, m.orders, m.delivered]),
              ];
              const csv = rows.map((r) => r.join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "reporte-obraya.csv"; a.click();
            }}
            className="flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>

        {/* Range filter */}
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                range === r ? "bg-amber-500 text-white" : "bg-white text-slate-700 border border-gray-200 hover:border-amber-500"
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const up = kpi.change >= 0;
            return (
              <div key={kpi.label} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200">
                <p className="text-sm text-slate-500">{kpi.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{kpi.value}</p>
                {kpi.change !== 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    {up
                      ? <TrendingUp className="w-4 h-4 text-emerald-500" />
                      : <TrendingDown className="w-4 h-4 text-red-500" />
                    }
                    <span className={`text-xs font-semibold ${up ? "text-emerald-600" : "text-red-600"}`}>
                      {up ? "+" : ""}{kpi.change}% vs período anterior
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Monthly table */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-slate-50 px-6 py-4">
            <h2 className="font-bold text-slate-900">Resumen Mensual</h2>
          </div>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">Sin datos suficientes</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left font-semibold text-slate-900">Período</th>
                  <th className="px-6 py-4 text-right font-semibold text-slate-900">Ingresos</th>
                  <th className="px-6 py-4 text-right font-semibold text-slate-900">Órdenes</th>
                  <th className="px-6 py-4 text-right font-semibold text-slate-900">Entregadas</th>
                  <th className="px-6 py-4 text-right font-semibold text-slate-900">Conversión</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((row) => {
                  const conv = row.orders > 0 ? ((row.delivered / row.orders) * 100).toFixed(0) : "0";
                  return (
                    <tr key={row.date} className="border-b border-gray-100 hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900 capitalize">{row.date}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(row.revenue)}</td>
                      <td className="px-6 py-4 text-right text-slate-600">{row.orders}</td>
                      <td className="px-6 py-4 text-right text-slate-600">{row.delivered}</td>
                      <td className="px-6 py-4 text-right text-slate-600">{conv}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Top performers */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 bg-slate-50 px-6 py-4">
              <h3 className="font-bold text-slate-900">Top Comercios por Ingresos</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {topComercios.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">Sin datos aún</p>
              ) : topComercios.map((c, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.orders} órdenes</p>
                  </div>
                  <p className="font-bold text-slate-900">{formatCurrency(c.revenue)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 bg-slate-50 px-6 py-4">
              <h3 className="font-bold text-slate-900">Top Compradores por Gasto</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {topBuyers.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">Sin datos aún</p>
              ) : topBuyers.map((b, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium text-slate-900">{b.name}</p>
                    <p className="text-xs text-slate-500">{b.orders} órdenes</p>
                  </div>
                  <p className="font-bold text-slate-900">{formatCurrency(b.spent)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platform summary */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-200 p-6">
          <h2 className="font-bold text-slate-900 mb-4">Estado de la plataforma</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Usuarios totales", value: stats?.users ?? 0 },
              { label: "Comercios activos", value: stats?.comercios ?? 0 },
              { label: "Órdenes totales", value: stats?.orders ?? 0 },
              { label: "Canceladas (período)", value: cancelled.length },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500 font-semibold">{item.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
