"use client";

import { useState } from "react";
import { Search, Filter, ChevronRight } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Orden {
  id: string;
  number: string;
  buyer: string;
  comercio: string;
  total: number;
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
  paymentMethod: string;
  createdAt: string;
  items: number;
}

const ORDENES: Orden[] = [
  { id: "1", number: "OBY-2026-12345", buyer: "María González", comercio: "Ferretería Central", total: 15000, status: "DELIVERED", paymentMethod: "Efectivo", createdAt: "2026-04-18", items: 3 },
  { id: "2", number: "OBY-2026-12344", buyer: "Juan Pérez", comercio: "Distribuidor Premium", total: 28500, status: "IN_TRANSIT", paymentMethod: "Tarjeta", createdAt: "2026-04-18", items: 5 },
  { id: "3", number: "OBY-2026-12343", buyer: "Ana Compradora", comercio: "MegaStock Industrial", total: 42000, status: "CONFIRMED", paymentMethod: "Mercado Pago", createdAt: "2026-04-17", items: 8 },
  { id: "4", number: "OBY-2026-12342", buyer: "Carlos Diseño", comercio: "Materiales Norte", total: 9500, status: "PREPARING", paymentMethod: "Efectivo", createdAt: "2026-04-17", items: 2 },
  { id: "5", number: "OBY-2026-12341", buyer: "Laura Construcción", comercio: "Ferretería Central", total: 35000, status: "PENDING", paymentMethod: "Tarjeta", createdAt: "2026-04-16", items: 6 },
  { id: "6", number: "OBY-2026-12340", buyer: "Roberto Obras", comercio: "Distribuidor Premium", total: 56000, status: "DELIVERED", paymentMethod: "Mercado Pago", createdAt: "2026-04-15", items: 10 },
];

const STATUS_CONFIG = {
  PENDING: { label: "Pendiente", color: "bg-amber-100 text-amber-800", bgFull: "bg-amber-50" },
  CONFIRMED: { label: "Confirmada", color: "bg-sky-100 text-sky-800", bgFull: "bg-sky-50" },
  PREPARING: { label: "Preparando", color: "bg-purple-100 text-purple-800", bgFull: "bg-purple-50" },
  IN_TRANSIT: { label: "En tránsito", color: "bg-blue-100 text-blue-800", bgFull: "bg-blue-50" },
  DELIVERED: { label: "Entregada", color: "bg-emerald-100 text-emerald-800", bgFull: "bg-emerald-50" },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-800", bgFull: "bg-red-50" },
};

export default function AdminOrdenesList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Orden["status"]>("all");

  const filtered = ORDENES.filter((orden) => {
    const matchesSearch = orden.number.includes(search) || orden.buyer.toLowerCase().includes(search.toLowerCase()) || orden.comercio.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || orden.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOrderValue = filtered.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = filtered.length > 0 ? totalOrderValue / filtered.length : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Órdenes</h1>
            <p className="mt-1 text-sm text-slate-500">Monitorea todas las órdenes de la plataforma en tiempo real.</p>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-slate-500">Órdenes Totales</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{ORDENES.length}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-slate-500">Valor Total</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(totalOrderValue)}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-slate-500">Valor Promedio</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(avgOrderValue)}</p>
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
              placeholder="Buscar por # orden, comprador o comercio..."
              className="w-full border border-gray-200 rounded-2xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "PENDING", "CONFIRMED", "PREPARING", "IN_TRANSIT", "DELIVERED"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  statusFilter === status ? "bg-amber-500 text-white" : "bg-white text-slate-700 border border-gray-200 hover:border-amber-500"
                }`}
              >
                {status === "all" ? "Todas" : STATUS_CONFIG[status].label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {filtered.map((orden) => {
            const statusConfig = STATUS_CONFIG[orden.status];
            return (
              <div key={orden.id} className={`rounded-2xl border-l-4 p-4 ${statusConfig.bgFull} border-l-amber-500 cursor-pointer hover:shadow-md transition`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-slate-900">{orden.number}</p>
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${statusConfig.color}`}>{statusConfig.label}</span>
                    </div>
                    <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Comprador</p>
                        <p className="text-slate-900 font-medium">{orden.buyer}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Comercio</p>
                        <p className="text-slate-900 font-medium">{orden.comercio}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Pago</p>
                        <p className="text-slate-900 font-medium">{orden.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Creada</p>
                        <p className="text-slate-900 font-medium">{orden.createdAt}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(orden.total)}</p>
                    <p className="text-xs text-slate-500">{orden.items} artículos</p>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
