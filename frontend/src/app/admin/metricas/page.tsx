"use client";

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, AlertCircle } from "lucide-react";

const chartData = [
  { name: "Sem 1", revenue: 45000, orders: 95, deliveries: 92 },
  { name: "Sem 2", revenue: 52000, orders: 108, deliveries: 105 },
  { name: "Sem 3", revenue: 48000, orders: 102, deliveries: 99 },
  { name: "Sem 4", revenue: 40000, orders: 85, deliveries: 82 },
];

const performanceData = [
  { name: "Excelente (90-100)", value: 45, fill: "#10b981" },
  { name: "Bueno (75-89)", value: 35, fill: "#3b82f6" },
  { name: "Regular (60-74)", value: 15, fill: "#f59e0b" },
  { name: "Necesita Mejora (<60)", value: 5, fill: "#ef4444" },
];

const deliveryMetrics = [
  { name: "En Tiempo", value: 89, color: "bg-emerald-100 text-emerald-800" },
  { name: "Retrasada", value: 8, color: "bg-amber-100 text-amber-800" },
  { name: "Cancelada", value: 2, color: "bg-red-100 text-red-800" },
];

const kpis = [
  { label: "Tasa de Éxito de Entregas", value: "97.2%", target: "95%", status: "exceeds" },
  { label: "Satisfacción de Clientes", value: "4.7/5", target: "4.5/5", status: "exceeds" },
  { label: "Tiempo Promedio Entrega", value: "27 min", target: "30 min", status: "exceeds" },
  { label: "Tasa de Retención", value: "94.3%", target: "90%", status: "exceeds" },
];

export default function AdminMetricas() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Métricas</h1>
          <p className="mt-1 text-sm text-slate-500">Dashboard de indicadores de desempeño clave y tendencias operacionales.</p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200">
              <p className="text-xs text-slate-500 uppercase font-semibold">{kpi.label}</p>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                <p className="text-xs text-slate-600">vs {kpi.target}</p>
              </div>
              <div className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                ✓ Supera expectativa
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue & Orders Trend */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="font-bold text-slate-900 mb-4">Tendencia Semanal</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" }} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#f59e0b" name="Ingresos" strokeWidth={2} />
                <Line type="monotone" dataKey="orders" stroke="#3b82f6" name="Órdenes" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Distribution */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="font-bold text-slate-900 mb-4">Distribución de Desempeño</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={performanceData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delivery Status */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <h2 className="font-bold text-slate-900 mb-4">Estado de Entregas</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {deliveryMetrics.map((metric, idx) => (
              <div key={idx} className={`rounded-lg p-4 ${metric.color}`}>
                <p className="text-sm font-semibold">{metric.name}</p>
                <p className="mt-2 text-2xl font-bold">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Health Checks */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-200">
          <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Chequeos de Salud del Sistema
          </h2>
          <div className="space-y-3">
            {[
              { name: "API Response Time", status: "optimal", value: "45ms", threshold: "<100ms" },
              { name: "Base de Datos Load", status: "optimal", value: "32%", threshold: "<70%" },
              { name: "Cache Hit Rate", status: "optimal", value: "94.2%", threshold: ">90%" },
              { name: "Error Rate", status: "optimal", value: "0.02%", threshold: "<0.5%" },
            ].map((check, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                <div>
                  <p className="font-medium text-slate-900">{check.name}</p>
                  <p className="text-xs text-slate-500">{check.threshold}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-emerald-600">{check.value}</p>
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-2xl bg-amber-50 p-6 border border-amber-200">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h3 className="font-bold text-amber-900">Alertas Activas</h3>
              <ul className="mt-2 space-y-1 text-sm text-amber-800">
                <li>• Se detectó un aumento en el tiempo de entregas en la zona Sur este fin de semana</li>
                <li>• 2 comercios con inventario bajo - contactarlos para reabastecimiento</li>
                <li>• Programa de mantenimiento preventivo de BD programado para el jueves a las 2 AM</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
