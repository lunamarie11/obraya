"use client";

import { useEffect, useState } from "react";
import { Search, MapPin, Phone, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { adminApi } from "@/lib/api";

interface AdminDelivery {
  id: string;
  orderId: string;
  status: "PENDING" | "ACCEPTED" | "PICKING_UP" | "IN_TRANSIT" | "DELIVERED";
  total: number;
  createdAt: string;
  estimatedTime: string;
  distance: string;
  address: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  driver?: {
    id: string;
    name: string;
    phone?: string;
    vehicle?: string;
  } | null;
}

const STATUS_CONFIG = {
  PENDING: { label: "Pendiente", color: "bg-slate-100 text-slate-800" },
  ACCEPTED: { label: "Aceptada", color: "bg-amber-100 text-amber-800" },
  PICKING_UP: { label: "Recogiendo", color: "bg-purple-100 text-purple-800" },
  IN_TRANSIT: { label: "En tránsito", color: "bg-blue-100 text-blue-800" },
  DELIVERED: { label: "Entregada", color: "bg-emerald-100 text-emerald-800" },
};

export default function AdminEntregasList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminDelivery["status"]>("all");
  const [deliveries, setDeliveries] = useState<AdminDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getAllDeliveries({ limit: 100, offset: 0 })
      .then((data) => setDeliveries(data.deliveries || []))
      .catch((error) => {
        console.error("Error fetching deliveries:", error);
        setDeliveries([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = deliveries.filter((delivery) => {
    const matchesSearch =
      delivery.orderId.includes(search) ||
      delivery.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      delivery.address.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeDeliveries = deliveries.filter((delivery) => delivery.status === "IN_TRANSIT" || delivery.status === "PICKING_UP").length;
  const totalValue = filtered.reduce((sum, delivery) => sum + delivery.total, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Entregas</h1>
            <p className="mt-1 text-sm text-slate-500">Monitorea entregas activas y el desempeño de repartidores.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-slate-500">Entregas Actuales</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{deliveries.length}</p>
              <p className="mt-1 text-xs text-emerald-600">↑ {activeDeliveries} activas</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-slate-500">Valor Total</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(totalValue)}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-slate-500">Repartidores Activos</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{deliveries.filter((d) => d.driver?.name).length}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por # entrega, repartidor o dirección..."
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {filtered.map((delivery) => {
            const statusConfig = STATUS_CONFIG[delivery.status];
            return (
              <div key={delivery.id} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-slate-900">{delivery.orderId}</p>
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${statusConfig.color}`}>{statusConfig.label}</span>
                    </div>
                    <p className="text-xs text-slate-500">Cliente: {delivery.customer.name}</p>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(delivery.total)}</p>
                </div>

                <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-gray-200">
                  <p className="font-semibold text-sm text-slate-900 mb-2">Repartidor</p>
                  <div className="flex flex-col gap-2 text-xs text-slate-600">
                    <p>{delivery.driver?.name ?? "Sin asignar"}</p>
                    {delivery.driver?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        {delivery.driver.phone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                    <div className="flex-1 text-sm">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Dirección</p>
                      <p className="text-slate-900 font-medium">{delivery.address}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {delivery.distance}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {delivery.estimatedTime}
                  </div>
                  <div>{new Date(delivery.createdAt).toLocaleString()}</div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-3xl bg-white p-8 text-center text-slate-500 border border-gray-200">
              No se encontraron entregas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
