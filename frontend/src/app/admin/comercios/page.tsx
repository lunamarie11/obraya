"use client";

import { useState } from "react";
import { Search, MoreVertical, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Comercio {
  id: string;
  name: string;
  email: string;
  phone: string;
  revenue: number;
  ordersCount: number;
  status: "active" | "inactive" | "pending";
  joinDate: string;
}

const COMERCIOS: Comercio[] = [
  { id: "1", name: "Ferretería Central", email: "central@ferreteria.com", phone: "+54 11 1234 5678", revenue: 125000, ordersCount: 42, status: "active", joinDate: "2025-11-15" },
  { id: "2", name: "Distribuidor Premium", email: "info@premium.com", phone: "+54 11 9876 5432", revenue: 89000, ordersCount: 28, status: "active", joinDate: "2025-12-01" },
  { id: "3", name: "Materiales Norte", email: "norte@materiales.com", phone: "+54 11 5555 4444", revenue: 45000, ordersCount: 15, status: "pending", joinDate: "2026-01-10" },
  { id: "4", name: "Construcciones Sur", email: "sur@construcciones.com", phone: "+54 11 3333 2222", revenue: 0, ordersCount: 0, status: "inactive", joinDate: "2025-10-20" },
  { id: "5", name: "MegaStock Industrial", email: "mega@stock.com", phone: "+54 11 7777 8888", revenue: 156000, ordersCount: 58, status: "active", joinDate: "2025-09-05" },
];

const STATUS_CONFIG = {
  active: { label: "Activo", color: "bg-emerald-100 text-emerald-800" },
  inactive: { label: "Inactivo", color: "bg-slate-100 text-slate-800" },
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-800" },
};

export default function AdminComerciosList() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "pending">("all");

  const filtered = COMERCIOS.filter((comercio) => {
    const matchesSearch = comercio.name.toLowerCase().includes(search.toLowerCase()) || comercio.email.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || comercio.status === filter;
    return matchesSearch && matchesFilter;
  });

  const totalRevenue = filtered.reduce((sum, c) => sum + c.revenue, 0);
  const totalOrders = filtered.reduce((sum, c) => sum + c.ordersCount, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Comercios</h1>
              <p className="mt-1 text-sm text-slate-500">Monitorea y gestiona todos los comercios de la plataforma.</p>
            </div>
            <button className="rounded-3xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition">
              + Agregar Comercio
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-slate-500">Comercios Totales</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{COMERCIOS.length}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-slate-500">Ingresos Totales</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-slate-500">Órdenes Totales</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{totalOrders}</p>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar comercio por nombre o email..."
              className="w-full border border-gray-200 rounded-2xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "inactive", "pending"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  filter === status ? "bg-amber-500 text-white" : "bg-white text-slate-700 border border-gray-200 hover:border-amber-500"
                }`}
              >
                {status === "all" ? "Todos" : status === "active" ? "Activos" : status === "inactive" ? "Inactivos" : "Pendientes"}
              </button>
            ))}
          </div>
        </div>

        {/* Commerc table */}
        <div className="rounded-3xl bg-white shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50">
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Comercio</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Contacto</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-900">Órdenes</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-900">Ingresos</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-900">Estado</th>
                <th className="px-6 py-4 text-right font-semibold text-slate-900"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((comercio) => {
                const statusConfig = STATUS_CONFIG[comercio.status];
                return (
                  <tr key={comercio.id} className="border-b border-gray-200 hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{comercio.name}</p>
                        <p className="text-xs text-slate-500">Desde {comercio.joinDate}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">
                        <p>{comercio.email}</p>
                        <p className="text-xs text-slate-500">{comercio.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="font-semibold text-slate-900">{comercio.ordersCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-900">
                      {formatCurrency(comercio.revenue)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition">
                        <MoreVertical className="w-4 h-4 text-slate-500" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
