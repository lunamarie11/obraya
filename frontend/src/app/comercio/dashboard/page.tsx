"use client";

import { useState } from "react";
import {
  DollarSign, ShoppingCart, Package, TrendingUp, TrendingDown,
  Users, ArrowUpRight, ArrowDownRight, BarChart3, Truck,
  Star, Clock, AlertTriangle, CheckCircle2, Eye,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────
type Period = "hoy" | "semana" | "mes" | "trimestre";

interface SaleRow {
  id: string;
  customer: string;
  items: number;
  total: number;
  status: "completada" | "en_proceso" | "pendiente";
  date: string;
  time: string;
}

interface TopProduct {
  name: string;
  emoji: string;
  sold: number;
  revenue: number;
  trend: number;
}

// ── Mock Data ──────────────────────────────────────────────────────────────
const METRICS: Record<Period, { revenue: number; orders: number; avgTicket: number; customers: number; revChange: number; ordChange: number; ticketChange: number; custChange: number }> = {
  hoy: { revenue: 2850000, orders: 18, avgTicket: 158333, customers: 14, revChange: 12.5, ordChange: 8.3, ticketChange: 3.8, custChange: 16.7 },
  semana: { revenue: 18400000, orders: 124, avgTicket: 148387, customers: 89, revChange: 8.2, ordChange: 5.1, ticketChange: 2.9, custChange: 11.4 },
  mes: { revenue: 72500000, orders: 486, avgTicket: 149177, customers: 312, revChange: 15.3, ordChange: 12.8, ticketChange: 2.2, custChange: 18.6 },
  trimestre: { revenue: 198000000, orders: 1342, avgTicket: 147541, customers: 687, revChange: 22.1, ordChange: 18.9, ticketChange: 2.7, custChange: 25.3 },
};

const RECENT_SALES: SaleRow[] = [
  { id: "ORD-2861", customer: "Constructora Del Sur S.A.", items: 24, total: 425000, status: "completada", date: "2026-04-12", time: "14:32" },
  { id: "ORD-2860", customer: "Arq. Marina Rodríguez", items: 8, total: 186500, status: "en_proceso", date: "2026-04-12", time: "13:15" },
  { id: "ORD-2859", customer: "Cooperativa La Unión", items: 32, total: 892000, status: "en_proceso", date: "2026-04-12", time: "12:45" },
  { id: "ORD-2858", customer: "Inmobiliaria Costa Group", items: 45, total: 1250000, status: "pendiente", date: "2026-04-12", time: "11:20" },
  { id: "ORD-2857", customer: "Juan Martínez", items: 5, total: 42500, status: "completada", date: "2026-04-12", time: "10:05" },
  { id: "ORD-2856", customer: "Desarrollos MNP", items: 60, total: 2180000, status: "completada", date: "2026-04-11", time: "16:40" },
  { id: "ORD-2855", customer: "Carlos Méndez Obras", items: 15, total: 340000, status: "completada", date: "2026-04-11", time: "15:22" },
  { id: "ORD-2854", customer: "Estudio Arq. Soto", items: 12, total: 278000, status: "completada", date: "2026-04-11", time: "14:10" },
];

const TOP_PRODUCTS: TopProduct[] = [
  { name: "Cemento Portland 50kg", emoji: "🪨", sold: 1280, revenue: 8704000, trend: 15.2 },
  { name: "Cal Hidráulica 25kg", emoji: "⚪", sold: 640, revenue: 1792000, trend: 8.4 },
  { name: "Cable Unipolar 2.5mm", emoji: "⚡", sold: 520, revenue: 509600, trend: 22.1 },
  { name: "Varilla Nervada Ø12mm", emoji: "🔩", sold: 430, revenue: 1806000, trend: -3.2 },
  { name: "Porcellanato 60×60", emoji: "🟦", sold: 312, revenue: 1185600, trend: 11.7 },
];

const HOURLY_SALES = [
  { hour: "8am", value: 3 }, { hour: "9am", value: 5 }, { hour: "10am", value: 8 },
  { hour: "11am", value: 12 }, { hour: "12pm", value: 7 }, { hour: "1pm", value: 9 },
  { hour: "2pm", value: 14 }, { hour: "3pm", value: 11 }, { hour: "4pm", value: 6 },
  { hour: "5pm", value: 4 }, { hour: "6pm", value: 2 },
];

const CATEGORY_SALES = [
  { name: "Cemento y Cal", pct: 32, color: "bg-navy-500" },
  { name: "Hierro y Acero", pct: 22, color: "bg-brand-500" },
  { name: "Electricidad", pct: 18, color: "bg-info-500" },
  { name: "Cerámicas", pct: 12, color: "bg-success-500" },
  { name: "Pinturas", pct: 9, color: "bg-warning-500" },
  { name: "Otros", pct: 7, color: "bg-gray-400" },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function saleStatusConfig(s: SaleRow["status"]) {
  switch (s) {
    case "completada": return { label: "Completada", color: "bg-success-50 text-success-500", dot: "bg-success-500" };
    case "en_proceso": return { label: "En proceso", color: "bg-info-50 text-info-500", dot: "bg-info-500" };
    case "pendiente": return { label: "Pendiente", color: "bg-warning-50 text-warning-500", dot: "bg-warning-500" };
  }
}

// ── Component ──────────────────────────────────────────────────────────────
export default function ComercioDashboardPage() {
  const [period, setPeriod] = useState<Period>("mes");
  const m = METRICS[period];
  const maxHourlySale = Math.max(...HOURLY_SALES.map((h) => h.value));

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

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { icon: DollarSign, label: "Facturación", value: formatCurrency(m.revenue), change: m.revChange, bg: "bg-success-50", color: "text-success-500" },
          { icon: ShoppingCart, label: "Pedidos", value: m.orders.toString(), change: m.ordChange, bg: "bg-info-50", color: "text-info-500" },
          { icon: BarChart3, label: "Ticket promedio", value: formatCurrency(m.avgTicket), change: m.ticketChange, bg: "bg-brand-50", color: "text-brand-500" },
          { icon: Users, label: "Clientes activos", value: m.customers.toString(), change: m.custChange, bg: "bg-navy-50", color: "text-navy-500" },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", kpi.bg)}>
                <kpi.icon className={cn("w-5 h-5", kpi.color)} />
              </div>
              <span className={cn("flex items-center gap-1 text-xs font-bold", kpi.change >= 0 ? "text-success-500" : "text-danger-500")}>
                {kpi.change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {Math.abs(kpi.change)}%
              </span>
            </div>
            <div className="text-2xl font-extrabold text-dark-800">{kpi.value}</div>
            <div className="text-xs text-gray-400 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Hourly Sales Chart */}
        <div className="col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-dark-800">Ventas por hora (hoy)</h3>
            <span className="text-xs text-gray-400">{HOURLY_SALES.reduce((s, h) => s + h.value, 0)} pedidos</span>
          </div>
          <div className="flex items-end gap-2 h-40">
            {HOURLY_SALES.map((h) => (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-dark-800">{h.value}</span>
                <div
                  className="w-full bg-navy-500 rounded-t-md transition-all hover:bg-navy-600"
                  style={{ height: `${(h.value / maxHourlySale) * 100}%`, minHeight: "4px" }}
                />
                <span className="text-[9px] text-gray-400">{h.hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card p-5">
          <h3 className="font-bold text-sm text-dark-800 mb-4">Ventas por categoría</h3>
          <div className="space-y-3">
            {CATEGORY_SALES.map((c) => (
              <div key={c.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 font-medium">{c.name}</span>
                  <span className="font-bold text-dark-800">{c.pct}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", c.color)} style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent Sales */}
        <div className="col-span-2 card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-dark-800">Ventas recientes</h3>
            <button className="text-xs font-semibold text-navy-500 hover:text-navy-600">Ver todas →</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="text-left px-5 py-2.5">Pedido</th>
                <th className="text-left px-3 py-2.5">Cliente</th>
                <th className="text-right px-3 py-2.5">Ítems</th>
                <th className="text-right px-3 py-2.5">Total</th>
                <th className="text-center px-3 py-2.5">Estado</th>
                <th className="text-right px-3 py-2.5">Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {RECENT_SALES.map((sale) => {
                const sc = saleStatusConfig(sale.status);
                return (
                  <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-bold text-dark-800">{sale.id}</td>
                    <td className="px-3 py-3 text-gray-600">{sale.customer}</td>
                    <td className="px-3 py-3 text-right text-gray-500">{sale.items}</td>
                    <td className="px-3 py-3 text-right font-bold text-dark-800">{formatCurrency(sale.total)}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold", sc.color)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-xs text-gray-400">{sale.time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Top Products + Quick Stats */}
        <div className="space-y-4">
          {/* Top Products */}
          <div className="card p-5">
            <h3 className="font-bold text-sm text-dark-800 mb-3">Productos más vendidos</h3>
            <div className="space-y-3">
              {TOP_PRODUCTS.map((p, idx) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-300 w-4">{idx + 1}</span>
                  <span className="text-lg">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-dark-800 truncate">{p.name}</div>
                    <div className="text-[10px] text-gray-400">{p.sold} vendidos</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-dark-800">{formatCurrency(p.revenue)}</div>
                    <span className={cn("text-[10px] font-semibold", p.trend >= 0 ? "text-success-500" : "text-danger-500")}>
                      {p.trend >= 0 ? "↑" : "↓"} {Math.abs(p.trend)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card p-5">
            <h3 className="font-bold text-sm text-dark-800 mb-3">Estado operativo</h3>
            <div className="space-y-2.5">
              {[
                { icon: Truck, label: "Entregas en camino", value: "4", color: "text-info-500" },
                { icon: AlertTriangle, label: "Entregas demoradas", value: "1", color: "text-danger-500" },
                { icon: Package, label: "Productos con stock bajo", value: "3", color: "text-warning-500" },
                { icon: CheckCircle2, label: "Entregas completadas hoy", value: "7", color: "text-success-500" },
                { icon: Star, label: "Rating promedio", value: "4.8", color: "text-warning-500" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                    {stat.label}
                  </div>
                  <span className="font-bold text-sm text-dark-800">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
