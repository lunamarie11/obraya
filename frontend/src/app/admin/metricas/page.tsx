"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { adminApi, dashboardApi } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  DELIVERED:  "#10b981",
  IN_TRANSIT: "#3b82f6",
  PREPARING:  "#6366f1",
  CONFIRMED:  "#8b5cf6",
  PENDING:    "#f59e0b",
  CANCELLED:  "#ef4444",
};
const STATUS_LABELS: Record<string, string> = {
  DELIVERED: "Entregado", IN_TRANSIT: "En camino",
  PREPARING: "En prep.", CONFIRMED: "Confirmado",
  PENDING: "Pendiente", CANCELLED: "Cancelado",
};

function groupByWeek(orders: any[]): { name: string; revenue: number; orders: number }[] {
  const weeks: Record<string, { revenue: number; orders: number }> = {};
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const week = `S${getWeekNumber(d)} ${d.getFullYear()}`;
    if (!weeks[week]) weeks[week] = { revenue: 0, orders: 0 };
    weeks[week].revenue += o.total ?? 0;
    weeks[week].orders += 1;
  });
  return Object.entries(weeks)
    .slice(-8)
    .map(([name, v]) => ({ name, ...v }));
}

function getWeekNumber(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}

export default function AdminMetricas() {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getDashboardStats(),
      adminApi.getAllOrders({ limit: 500 }),
      dashboardApi.getCategoryStats(),
    ])
      .then(([s, o, cats]) => {
        setStats(s);
        setOrders(o.orders ?? o ?? []);
        setCategories(cats ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const orderList: any[] = Array.isArray(orders) ? orders : [];

  // Derived metrics
  const delivered   = orderList.filter((o) => o.status === "DELIVERED").length;
  const cancelled   = orderList.filter((o) => o.status === "CANCELLED").length;
  const total       = orderList.length;
  const successRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : "0.0";
  const cancelRate  = total > 0 ? ((cancelled / total) * 100).toFixed(1) : "0.0";
  const revenue     = orderList.filter((o) => o.status === "DELIVERED").reduce((s, o) => s + (o.total ?? 0), 0);
  const avgTicket   = delivered > 0 ? Math.round(revenue / delivered) : 0;

  // Status distribution for pie chart
  const statusCounts: Record<string, number> = {};
  orderList.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1; });
  const pieData = Object.entries(statusCounts).map(([status, value]) => ({
    name: STATUS_LABELS[status] ?? status, value, fill: STATUS_COLORS[status] ?? "#94a3b8",
  }));

  // Weekly trend
  const weeklyData = groupByWeek(orderList);

  // Category bar chart
  const catData = categories.slice(0, 8).map((c) => ({
    name: c.name, productos: c.productCount, stock: c.totalStock,
  }));

  const kpis = [
    { label: "Tasa de éxito",     value: `${successRate}%`,           sub: "órdenes entregadas" },
    { label: "Ingresos totales",  value: formatCurrency(revenue),      sub: "de órdenes entregadas" },
    { label: "Ticket promedio",   value: formatCurrency(avgTicket),    sub: "por orden entregada" },
    { label: "Tasa cancelación",  value: `${cancelRate}%`,             sub: `${cancelled} órdenes` },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Métricas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Indicadores operacionales en tiempo real · {total} órdenes totales
          </p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200">
              <p className="text-xs text-slate-500 uppercase font-semibold">{kpi.label}</p>
              <p className="mt-3 text-2xl font-bold text-slate-900">{kpi.value}</p>
              <p className="mt-1 text-xs text-slate-400">{kpi.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weekly trend */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="font-bold text-slate-900 mb-4">Tendencia semanal</h2>
            {weeklyData.length === 0 ? (
              <p className="text-sm text-slate-400 py-16 text-center">Sin datos suficientes aún</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" }} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#f59e0b" name="Ingresos" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="orders" stroke="#3b82f6" name="Órdenes" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Status distribution */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="font-bold text-slate-900 mb-4">Distribución de estados</h2>
            {pieData.length === 0 ? (
              <p className="text-sm text-slate-400 py-16 text-center">Sin órdenes aún</p>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="60%" height={240}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v, name) => [`${v} órdenes`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                      <span className="text-slate-600">{entry.name}</span>
                      <span className="font-bold text-slate-900 ml-auto pl-3">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Categories */}
        {catData.length > 0 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="font-bold text-slate-900 mb-4">Productos por categoría</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={catData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" }} />
                <Legend />
                <Bar dataKey="productos" fill="#f59e0b" name="Productos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stock" fill="#3b82f6" name="Stock total" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Platform health */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Resumen de plataforma
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Usuarios totales",   value: stats?.users ?? 0 },
              { label: "Comercios activos",  value: stats?.comercios ?? 0 },
              { label: "Órdenes totales",    value: stats?.orders ?? 0 },
              { label: "Pendientes de pago", value: stats?.pendingOrders ?? 0 },
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
