"use client";

import { useState } from "react";
import { Download, Filter, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ReportMetric {
  label: string;
  value: string | number;
  change: number;
  icon: "up" | "down" | "neutral";
}

const reportMetrics: ReportMetric[] = [
  { label: "Ingresos Totales", value: formatCurrency(485000), change: 12.5, icon: "up" },
  { label: "Órdenes Completadas", value: "482", change: 8.3, icon: "up" },
  { label: "Tasa de Conversión", value: "68.5%", change: -2.1, icon: "down" },
  { label: "Orden Promedio", value: formatCurrency(1005), change: 4.2, icon: "up" },
];

interface ReportData {
  date: string;
  revenue: number;
  orders: number;
  deliveries: number;
  avgDeliveryTime: string;
}

const monthlyData: ReportData[] = [
  { date: "Enero", revenue: 145000, orders: 189, deliveries: 185, avgDeliveryTime: "28 min" },
  { date: "Febrero", revenue: 168000, orders: 212, deliveries: 208, avgDeliveryTime: "26 min" },
  { date: "Marzo", revenue: 172000, orders: 218, deliveries: 215, avgDeliveryTime: "29 min" },
  { date: "Abril (Parcial)", revenue: 85000, orders: 107, deliveries: 104, avgDeliveryTime: "27 min" },
];

export default function AdminReportes() {
  const [dateRange, setDateRange] = useState("month");

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Reportes</h1>
            <p className="mt-1 text-sm text-slate-500">Análisis detallado de operaciones y desempeño de la plataforma.</p>
          </div>
          <button className="flex items-center gap-2 rounded-3xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>

        {/* Date Range Filter */}
        <div className="flex gap-2 flex-wrap">
          {(["week", "month", "quarter", "year"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                dateRange === range ? "bg-amber-500 text-white" : "bg-white text-slate-700 border border-gray-200 hover:border-amber-500"
              }`}
            >
              {range === "week" ? "Última Semana" : range === "month" ? "Último Mes" : range === "quarter" ? "Último Trimestre" : "Último Año"}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reportMetrics.map((metric, idx) => (
            <div key={idx} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200">
              <p className="text-sm text-slate-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{metric.value}</p>
              <div className="mt-2 flex items-center gap-1">
                {metric.icon === "up" ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-xs font-semibold ${metric.icon === "up" ? "text-emerald-600" : "text-red-600"}`}>
                  {metric.icon === "up" ? "+" : ""}{metric.change}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly Data Table */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-slate-50 px-6 py-4">
            <h2 className="font-bold text-slate-900">Resumen Mensual</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Período</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-900">Ingresos</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-900">Órdenes</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-900">Entregas</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-900">Tpo. Promedio</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((data, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-semibold text-slate-900">{data.date}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(data.revenue)}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{data.orders}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{data.deliveries}</td>
                  <td className="px-6 py-4 text-right text-slate-600">{data.avgDeliveryTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Performers */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Comercios */}
          <div className="rounded-2xl bg-white shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 bg-slate-50 px-6 py-4">
              <h3 className="font-bold text-slate-900">Top Comercios por Ingresos</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {[
                { name: "MegaStock Industrial", revenue: 156000 },
                { name: "Ferretería Central", revenue: 125000 },
                { name: "Distribuidor Premium", revenue: 89000 },
              ].map((comercio, idx) => (
                <div key={idx} className="flex items-center justify-between px-6 py-4">
                  <p className="font-medium text-slate-900">{comercio.name}</p>
                  <p className="font-bold text-slate-900">{formatCurrency(comercio.revenue)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Buyers */}
          <div className="rounded-2xl bg-white shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 bg-slate-50 px-6 py-4">
              <h3 className="font-bold text-slate-900">Top Compradores por Gasto</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {[
                { name: "Roberto Obras", spent: 98000, orders: 8 },
                { name: "Laura Construcción", spent: 87000, orders: 7 },
                { name: "Carlos Diseño", spent: 65000, orders: 5 },
              ].map((buyer, idx) => (
                <div key={idx} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium text-slate-900">{buyer.name}</p>
                    <p className="text-xs text-slate-500">{buyer.orders} órdenes</p>
                  </div>
                  <p className="font-bold text-slate-900">{formatCurrency(buyer.spent)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
