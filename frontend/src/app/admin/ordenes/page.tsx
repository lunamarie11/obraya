"use client";

import { useEffect, useState } from "react";
import { Search, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { adminApi } from "@/lib/api";

interface AdminOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
  paymentMethod: string;
  createdAt: string;
  itemCount: number;
  customer: {
    id: string;
    name: string;
    email: string;
  };
}

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
  const [statusFilter, setStatusFilter] = useState<"all" | AdminOrder["status"]>("all");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getAllOrders({ limit: 100, offset: 0 })
      .then((data) => setOrders(data.orders || []))
      .catch((error) => {
        console.error("Error fetching orders:", error);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.includes(search) ||
      order.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOrderValue = filtered.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = filtered.length > 0 ? totalOrderValue / filtered.length : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Órdenes</h1>
            <p className="mt-1 text-sm text-slate-500">Monitorea todas las órdenes de la plataforma en tiempo real.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
              <p className="text-sm text-slate-500">Órdenes Totales</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{orders.length}</p>
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

        <div className="space-y-3">
          {filtered.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status];
            return (
              <div key={order.id} className={`rounded-2xl border-l-4 p-4 ${statusConfig.bgFull} border-l-amber-500 cursor-pointer hover:shadow-md transition`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${statusConfig.color}`}>{statusConfig.label}</span>
                    </div>
                    <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Comprador</p>
                        <p className="text-slate-900 font-medium">{order.customer.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Email</p>
                        <p className="text-slate-900 font-medium">{order.customer.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Pago</p>
                        <p className="text-slate-900 font-medium">{order.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Creada</p>
                        <p className="text-slate-900 font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-slate-500">{order.itemCount} artículos</p>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-3xl bg-white p-8 text-center text-slate-500 border border-gray-200">
              No se encontraron órdenes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
