"use client";

import { useState } from "react";
import { Package, Clock, CheckCircle, Truck, ChevronRight } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

const ORDERS = [
  {
    id: "OBY-2026-04719",
    date: "Hoy 09:14",
    items: "Cemento ×5, Varilla ×20",
    total: 284500,
    status: "en_camino",
    steps: [
      { label: "Pedido confirmado", sub: "Hoy a las 09:14 · Pago acreditado", done: true, current: false },
      { label: "En preparación", sub: "Hoy a las 09:32 · Depósito Corralón El Constructor", done: true, current: false },
      { label: "En camino", sub: "Carlos (chofer) está en route · 3.2 km de tu domicilio", done: false, current: true },
      { label: "Entregado", sub: "Pendiente", done: false, current: false },
    ],
    eta: "~18 minutos",
  },
  {
    id: "OBY-2026-04231",
    date: "03/04/2026",
    items: "Porcellanato 60×60 ×8 cajas",
    total: 30400,
    status: "entregado",
    steps: [
      { label: "Pedido confirmado", sub: "03/04 09:00", done: true, current: false },
      { label: "En preparación", sub: "03/04 09:45", done: true, current: false },
      { label: "En camino", sub: "03/04 11:00", done: true, current: false },
      { label: "Entregado", sub: "03/04 13:20", done: true, current: false },
    ],
    eta: null,
  },
  {
    id: "OBY-2026-03881",
    date: "28/03/2026",
    items: "Pintura Látex ×3, Cal ×10",
    total: 65500,
    status: "entregado",
    steps: [
      { label: "Pedido confirmado", sub: "28/03 10:00", done: true, current: false },
      { label: "En preparación", sub: "28/03 10:30", done: true, current: false },
      { label: "En camino", sub: "28/03 12:00", done: true, current: false },
      { label: "Entregado", sub: "28/03 15:45", done: true, current: false },
    ],
    eta: null,
  },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  en_camino: { label: "En camino", color: "text-navy-500", bg: "bg-navy-50" },
  entregado: { label: "Entregado", color: "text-success-500", bg: "bg-success-50" },
  preparando: { label: "En preparación", color: "text-warning-500", bg: "bg-warning-50" },
};

export default function SeguimientoPage() {
  const [selected, setSelected] = useState(ORDERS[0]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-dark-800">📦 Mis Pedidos</h1>
        <p className="text-sm text-gray-500 mt-1">Seguí el estado de tus entregas en tiempo real</p>
      </div>

      <div className="grid grid-cols-5 gap-6 max-w-5xl">
        {/* ── Orders list ── */}
        <div className="col-span-2 space-y-3">
          {ORDERS.map((order) => {
            const st = STATUS_CONFIG[order.status];
            const isSelected = selected.id === order.id;
            return (
              <button
                key={order.id}
                onClick={() => setSelected(order)}
                className={cn(
                  "w-full text-left card p-4 transition-all",
                  isSelected ? "border-navy-500 ring-1 ring-navy-500" : "hover:border-gray-200"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 font-mono">#{order.id}</span>
                  <ChevronRight className={cn("w-4 h-4 text-gray-300", isSelected && "text-navy-500")} />
                </div>
                <div className="text-sm font-semibold text-dark-800 mb-1 truncate">{order.items}</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{order.date}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{formatCurrency(order.total)}</span>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", st.color, st.bg)}>
                      {st.label}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Tracking detail ── */}
        <div className="col-span-3 card p-6">
          <div className="text-xs text-gray-400 font-mono mb-1">Pedido #{selected.id}</div>
          <div className="font-bold text-lg text-dark-800 mb-6">
            {selected.items} · {formatCurrency(selected.total)}
          </div>

          {/* Steps */}
          <div className="space-y-0">
            {selected.steps.map((step, i) => {
              const isLast = i === selected.steps.length - 1;
              return (
                <div key={i} className="flex gap-4 pb-6 relative">
                  {/* Connector line */}
                  {!isLast && (
                    <div
                      className={cn(
                        "absolute left-[15px] top-8 w-0.5 h-full",
                        step.done ? "bg-success-500" : "bg-gray-200"
                      )}
                    />
                  )}
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold z-10",
                      step.done
                        ? "bg-success-500 text-white"
                        : step.current
                          ? "bg-navy-500 text-white animate-pulse"
                          : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {step.done ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : step.current ? (
                      <Truck className="w-4 h-4" />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  {/* Text */}
                  <div className="pt-0.5">
                    <h4
                      className={cn(
                        "text-sm font-semibold",
                        !step.done && !step.current ? "text-gray-400" : "text-dark-800"
                      )}
                    >
                      {step.label}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">{step.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ETA Banner */}
          {selected.eta && (
            <div className="mt-2 flex items-center gap-4 bg-navy-50 border border-navy-100 rounded-xl p-4">
              <Clock className="w-8 h-8 text-navy-500 shrink-0" />
              <div>
                <div className="text-xs text-gray-500">Tiempo estimado de llegada</div>
                <div className="text-xl font-extrabold text-navy-500">{selected.eta}</div>
              </div>
            </div>
          )}

          {selected.status === "entregado" && (
            <div className="mt-4 flex items-center gap-4 bg-success-50 border border-success-500/20 rounded-xl p-4">
              <Package className="w-8 h-8 text-success-500 shrink-0" />
              <div>
                <div className="text-sm font-bold text-success-500">¡Pedido entregado con éxito!</div>
                <div className="text-xs text-gray-500 mt-0.5">¿Cómo estuvo el servicio? Dejá tu reseña</div>
              </div>
              <button className="ml-auto bg-success-500 hover:bg-success-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                Calificar ⭐
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
