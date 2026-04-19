"use client";

import { useState } from "react";
import { Search, MapPin, Phone, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Entrega {
  id: string;
  number: string;
  order: string;
  from: string;
  to: string;
  driver: string;
  driverPhone: string;
  distance: string;
  status: "PENDING" | "ACCEPTED" | "PICKING_UP" | "IN_TRANSIT" | "DELIVERED";
  value: number;
  estimatedTime: string;
  createdAt: string;
}

const ENTREGAS: Entrega[] = [
  { id: "1", number: "ENT-2026-01", order: "OBY-2026-12345", from: "Ferretería Central", to: "Obra Nueva - Belgrano", driver: "Pedro Repartidor", driverPhone: "+54 11 5555 4444", distance: "12 km", status: "DELIVERED", value: 1200, estimatedTime: "25 min", createdAt: "2026-04-18 10:30" },
  { id: "2", number: "ENT-2026-02", order: "OBY-2026-12344", from: "Distribuidor Premium", to: "Depósito Sur", driver: "Martín López", driverPhone: "+54 11 6666 7777", distance: "18 km", status: "IN_TRANSIT", value: 1500, estimatedTime: "35 min", createdAt: "2026-04-18 11:15" },
  { id: "3", number: "ENT-2026-03", order: "OBY-2026-12343", from: "MegaStock Industrial", to: "Obra Parque Centenario", driver: "Carlos Vega", driverPhone: "+54 11 8888 9999", distance: "8 km", status: "PICKING_UP", value: 2200, estimatedTime: "15 min", createdAt: "2026-04-18 12:00" },
  { id: "4", number: "ENT-2026-04", order: "OBY-2026-12342", from: "Materiales Norte", to: "Taller Mecánico", driver: "Ana García", driverPhone: "+54 11 4444 5555", distance: "5 km", status: "ACCEPTED", value: 800, estimatedTime: "12 min", createdAt: "2026-04-18 13:45" },
  { id: "5", number: "ENT-2026-05", order: "OBY-2026-12341", from: "Ferretería Central", to: "Obra Industrial San Martín", driver: "Roberto Díaz", driverPhone: "+54 11 3333 2222", distance: "22 km", status: "PENDING", value: 1800, estimatedTime: "40 min", createdAt: "2026-04-18 14:30" },
];

const STATUS_CONFIG = {
  PENDING: { label: "Pendiente", color: "bg-slate-100 text-slate-800" },
  ACCEPTED: { label: "Aceptada", color: "bg-amber-100 text-amber-800" },
  PICKING_UP: { label: "Recogiendo", color: "bg-purple-100 text-purple-800" },
  IN_TRANSIT: { label: "En tránsito", color: "bg-blue-100 text-blue-800" },
  DELIVERED: { label: "Entregada", color: "bg-emerald-100 text-emerald-800" },
};

export default function AdminEntregasList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Entrega["status"]>("all");

  const filtered = ENTREGAS.filter((entrega) => {
    const matchesSearch = entrega.number.includes(search) || entrega.driver.toLowerCase().includes(search.toLowerCase()) || entrega.from.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || entrega.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeDeliveries = ENTREGAS.filter((e) => e.status === "IN_TRANSIT" || e.status === "PICKING_UP").length;
  const totalValue = filtered.reduce((sum, e) => sum + e.value, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Entregas</h1>
            <p className="mt-1 text-sm text-slate-500">Monitorea entregas activas y el desempeño de repartidores.</p>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-slate-500">Entregas Hoy</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{ENTREGAS.length}</p>
              <p className="mt-1 text-xs text-emerald-600">↑ {activeDeliveries} activas</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-slate-500">Valor Total</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(totalValue)}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-slate-500">Repartidores Activos</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">4</p>
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
              placeholder="Buscar por # entrega, repartidor o origen..."
              className="w-full border border-gray-200 rounded-2xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "PENDING", "ACCEPTED", "PICKING_UP", "IN_TRANSIT", "DELIVERED"] as const).map((status) => (
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

        {/* Entregas Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {filtered.map((entrega) => {
            const statusConfig = STATUS_CONFIG[entrega.status];
            return (
              <div key={entrega.id} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-slate-900">{entrega.number}</p>
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${statusConfig.color}`}>{statusConfig.label}</span>
                    </div>
                    <p className="text-xs text-slate-500">Orden: {entrega.order}</p>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(entrega.value)}</p>
                </div>

                {/* Driver Info */}
                <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-gray-200">
                  <p className="font-semibold text-sm text-slate-900 mb-2">{entrega.driver}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Phone className="w-3 h-3" />
                    {entrega.driverPhone}
                  </div>
                </div>

                {/* Route */}
                <div className="mb-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                    <div className="flex-1 text-sm">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Desde</p>
                      <p className="text-slate-900 font-medium">{entrega.from}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-amber-500 mt-1 shrink-0" />
                    <div className="flex-1 text-sm">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Hasta</p>
                      <p className="text-slate-900 font-medium">{entrega.to}</p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {entrega.distance}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {entrega.estimatedTime}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    {entrega.createdAt}
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
