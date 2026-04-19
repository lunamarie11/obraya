"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp, Users, Store, Package, Truck, DollarSign,
  BarChart3, AlertCircle, CheckCircle2, Clock,
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalComercio: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    activeDeliveries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboardStats()
      .then((data) => {
        setStats({
          totalUsers: data.users || 0,
          totalComercio: data.comercios || 0,
          totalOrders: data.orders || 0,
          pendingOrders: data.pendingOrders || 0,
          totalRevenue: data.revenue || 0,
          activeDeliveries: data.deliveries || 0,
        });
      })
      .catch((err) => {
        console.error("Error fetching admin stats:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: "Total Usuarios", value: stats.totalUsers, icon: Users, color: "from-blue-600 to-blue-700", unit: "" },
    { label: "Comercios Activos", value: stats.totalComercio, icon: Store, color: "from-emerald-600 to-emerald-700", unit: "" },
    { label: "Órdenes Total", value: stats.totalOrders, icon: Package, color: "from-purple-600 to-purple-700", unit: "" },
    { label: "Entregas Activas", value: stats.activeDeliveries, icon: Truck, color: "from-orange-600 to-orange-700", unit: "" },
    { label: "Ingresos Totales", value: stats.totalRevenue, icon: DollarSign, color: "from-green-600 to-green-700", unit: "mxn", isCurrency: true },
    { label: "Órdenes Pendientes", value: stats.pendingOrders, icon: Clock, color: "from-red-600 to-red-700", unit: "" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-amber-300">Panel de Super Admin</p>
              <h1 className="mt-3 text-4xl font-extrabold">Monitoreo de Operatoria B2B y B2C</h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                Visualiza en tiempo real el estado de comercios, usuarios, órdenes y entregas en toda la plataforma.
              </p>
            </div>
            <div className="text-6xl">📊</div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={i} className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{kpi.label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {kpi.isCurrency ? formatCurrency(kpi.value) : kpi.value}
                    </p>
                  </div>
                  <div className={`rounded-2xl bg-gradient-to-br ${kpi.color} p-4 text-white`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Acciones Rápidas</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Ver Comercios", href: "/admin/comercios", icon: "🏪" },
              { label: "Gestionar Usuarios", href: "/admin/usuarios", icon: "👥" },
              { label: "Revisar Órdenes", href: "/admin/ordenes", icon: "📦" },
              { label: "Entregas en Ruta", href: "/admin/entregas", icon: "🚚" },
            ].map((action, i) => (
              <a
                key={i}
                href={action.href}
                className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-amber-500 hover:bg-amber-50 transition"
              >
                <div className="text-3xl mb-2">{action.icon}</div>
                <p className="text-sm font-semibold text-slate-700">{action.label}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Activity Overview */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Órdenes Completadas (Últimos 7 días)
            </h2>
            <div className="space-y-2 text-sm text-slate-600">
              <p>✓ Lunes: 8 órdenes</p>
              <p>✓ Martes: 6 órdenes</p>
              <p>✓ Miércoles: 12 órdenes</p>
              <p>✓ Jueves: 9 órdenes</p>
              <p>✓ Viernes: 15 órdenes</p>
              <p>✓ Sábado: 7 órdenes</p>
              <p className="font-semibold text-slate-900">Total: 57 órdenes completadas</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Alertas y Notificaciones
            </h2>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg bg-amber-50 p-3 text-amber-800">
                ⚠️ 3 órdenes sin asignar delivery en las últimas 2 horas
              </div>
              <div className="rounded-lg bg-red-50 p-3 text-red-800">
                🔴 1 entrega retrasada (pedido #OBY-2026-15234)
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-blue-800">
                ℹ️ 2 comercios solicitan verificación de datos
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
