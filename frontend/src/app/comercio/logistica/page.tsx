"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Truck, MapPin, Clock, Package, CheckCircle2,
  AlertTriangle, RefreshCw, ChevronRight, Gauge, Route,
  Loader2,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { ordersApi } from "@/lib/api";

type DisplayStatus = "en_deposito" | "en_camino" | "entregado" | "cancelado";

function orderToDisplayStatus(status: string): DisplayStatus {
  switch (status) {
    case "CONFIRMED":
    case "PREPARING":  return "en_deposito";
    case "IN_TRANSIT": return "en_camino";
    case "DELIVERED":  return "entregado";
    default:           return "cancelado";
  }
}

const STATUS_CONFIG: Record<DisplayStatus, { label: string; color: string; bg: string; dot: string; mapColor: string }> = {
  en_deposito: { label: "En depósito",  color: "bg-gray-100 text-gray-600",       dot: "bg-gray-400",     mapColor: "#9CA3AF" },
  en_camino:   { label: "En camino",    color: "bg-info-50 text-info-500",         dot: "bg-info-500",     mapColor: "#2980B9" },
  entregado:   { label: "Entregado",    color: "bg-success-50 text-success-500",   dot: "bg-success-500",  mapColor: "#27AE60" },
  cancelado:   { label: "Cancelado",    color: "bg-danger-50 text-danger-500",     dot: "bg-danger-500",   mapColor: "#E74C3C" },
};

function itemsSummary(items: any[]): string {
  if (!items?.length) return "Sin ítems";
  return items.map((i) => `${i.product?.name ?? "Producto"} ×${i.qty}`).join(", ");
}

// Deterministic pseudo-position based on order id for map display
function pseudoCoord(id: string, base: number, range: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  return base + ((Math.abs(hash) % 1000) / 1000) * range;
}

// SVG map: Buenos Aires area visualization
function LiveMap({ orders, selectedId, onSelect, pulse }: {
  orders: any[]; selectedId: string | null; onSelect: (id: string) => void; pulse: boolean;
}) {
  const active = orders.filter((o) => o.ds === "en_camino");

  return (
    <div className="relative w-full h-full bg-[#1a1a2e] rounded-xl overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {Array.from({ length: 20 }).map((_, i) => (
          <g key={i}>
            <line x1={i * 5} y1={0} x2={i * 5} y2={100} stroke="#ffffff08" strokeWidth={0.2} />
            <line x1={0} y1={i * 5} x2={100} y2={i * 5} stroke="#ffffff08" strokeWidth={0.2} />
          </g>
        ))}
        <line x1={20} y1={10} x2={20} y2={90} stroke="#ffffff15" strokeWidth={0.5} />
        <line x1={40} y1={5}  x2={40} y2={95} stroke="#ffffff15" strokeWidth={0.5} />
        <line x1={60} y1={15} x2={60} y2={85} stroke="#ffffff15" strokeWidth={0.5} />
        <line x1={80} y1={10} x2={80} y2={90} stroke="#ffffff15" strokeWidth={0.5} />
        <line x1={5}  y1={30} x2={95} y2={30} stroke="#ffffff15" strokeWidth={0.5} />
        <line x1={10} y1={50} x2={90} y2={50} stroke="#ffffff15" strokeWidth={0.5} />
        <line x1={5}  y1={70} x2={95} y2={70} stroke="#ffffff15" strokeWidth={0.5} />

        {active.map((o) => {
          const x = pseudoCoord(o.id, 15, 70);
          const y = pseudoCoord(o.id + "y", 15, 70);
          const isSelected = selectedId === o.id;
          const color = STATUS_CONFIG.en_camino.mapColor;
          return (
            <g key={o.id} className="cursor-pointer" onClick={() => onSelect(o.id)}>
              <circle cx={x} cy={y} r={isSelected ? 3.5 : 2.5} fill={color} opacity={pulse ? 0.15 : 0.08} />
              <circle cx={x} cy={y} r={isSelected ? 2}   r2={1.5} fill={color} opacity={0.4} />
              <circle cx={x} cy={y} r={isSelected ? 1.2 : 0.8}    fill={color} />
              {isSelected && (
                <text x={x + 2.5} y={y - 2} fill="white" fontSize={2.5} fontWeight="bold" fontFamily="system-ui">
                  {o.orderNumber}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex gap-4">
        {(["en_camino", "en_deposito", "entregado"] as DisplayStatus[]).map((s) => {
          const sc = STATUS_CONFIG[s];
          return (
            <div key={s} className="flex items-center gap-1.5 text-[10px] text-white/70">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.mapColor }} />
              {sc.label}
            </div>
          );
        })}
      </div>

      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
        <span className={cn("w-2 h-2 rounded-full bg-success-500 transition-opacity", pulse ? "opacity-100" : "opacity-30")} />
        <span className="text-[10px] text-white/70 font-semibold">EN VIVO</span>
      </div>

      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
        <Package className="w-3 h-3 text-yellow-400" />
        <span className="text-[10px] text-white/70 font-medium">Depósito Central · Avellaneda</span>
      </div>

      {active.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white/30 text-xs">Sin entregas activas en este momento</span>
        </div>
      )}
    </div>
  );
}

export default function LogisticaPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | "todos">("todos");
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 1500);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await ordersApi.getAll();
      // Only show active orders (exclude PENDING and CANCELLED for logistics view)
      const active = raw
        .filter((o) => ["CONFIRMED", "PREPARING", "IN_TRANSIT", "DELIVERED"].includes(o.status))
        .map((o) => ({ ...o, ds: orderToDisplayStatus(o.status) }));
      setOrders(active);
      if (active.length > 0 && !selected) setSelected(active[0].id);
    } catch {
      setError("No se pudieron cargar las entregas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = statusFilter === "todos" ? orders : orders.filter((o) => o.ds === statusFilter);
  const selectedOrder = orders.find((o) => o.id === selected) ?? null;

  const kpis = {
    en_camino:   orders.filter((o) => o.ds === "en_camino").length,
    en_deposito: orders.filter((o) => o.ds === "en_deposito").length,
    entregado:   orders.filter((o) => o.ds === "entregado").length,
  };

  return (
    <div className="p-8 h-[calc(100vh-0px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-dark-800">🚚 Logística en Tiempo Real</h1>
          <p className="text-sm text-gray-500 mt-1">Seguimiento de entregas activas</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-danger-50 text-danger-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { icon: Truck,         label: "En tránsito",    value: kpis.en_camino,   color: "text-info-500",    bg: "bg-info-50" },
          { icon: Package,       label: "En depósito",    value: kpis.en_deposito, color: "text-gray-500",    bg: "bg-gray-100" },
          { icon: CheckCircle2,  label: "Entregados hoy", value: kpis.entregado,   color: "text-success-500", bg: "bg-success-50" },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-4 flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", kpi.bg)}>
              <kpi.icon className={cn("w-5 h-5", kpi.color)} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-dark-800">{kpi.value}</div>
              <div className="text-[11px] text-gray-400">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-navy-500" />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-[1fr_380px] gap-4 min-h-0">
          {/* Map */}
          <LiveMap orders={orders} selectedId={selected} onSelect={setSelected} pulse={pulse} />

          {/* Sidebar */}
          <div className="card flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-dark-800">Entregas del día</h3>
                <span className="text-[10px] font-bold text-gray-400">{orders.length} envíos</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {(["todos", "en_camino", "en_deposito", "entregado"] as const).map((s) => {
                  const count = s === "todos" ? orders.length : orders.filter((o) => o.ds === s).length;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={cn(
                        "px-2 py-1 rounded text-[10px] font-semibold transition-all",
                        statusFilter === s ? "bg-navy-500 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                      )}
                    >
                      {s === "todos" ? "Todos" : STATUS_CONFIG[s].label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No hay entregas en este estado
                </div>
              ) : (
                filtered.map((o) => {
                  const sc = STATUS_CONFIG[o.ds as DisplayStatus];
                  const isSelected = selected === o.id;
                  return (
                    <div
                      key={o.id}
                      onClick={() => setSelected(o.id)}
                      className={cn(
                        "px-4 py-3 border-b border-gray-50 cursor-pointer transition-all hover:bg-gray-50",
                        isSelected && "bg-navy-50/50 border-l-2 border-l-navy-500"
                      )}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-dark-800">{o.orderNumber}</span>
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold", sc.color)}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                              {sc.label}
                            </span>
                          </div>
                          {o.user?.name && (
                            <div className="text-xs text-gray-500 mt-0.5">{o.user.name}</div>
                          )}
                        </div>
                        <ChevronRight className={cn("w-4 h-4 text-gray-300 transition-transform", isSelected && "rotate-90 text-navy-500")} />
                      </div>

                      {o.address && (
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-2">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{o.address.street}, {o.address.city}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1 text-gray-400">
                          <Package className="w-3 h-3" /> {o.items?.length ?? 0} ítems
                        </span>
                        <span className="font-bold text-dark-800">{formatCurrency(o.total)}</span>
                      </div>

                      {isSelected && (
                        <div className="mt-2 text-[10px] text-gray-400 truncate">
                          {itemsSummary(o.items)}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {selectedOrder && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-[11px] text-gray-400 flex justify-between">
                <span>{new Date(selectedOrder.createdAt).toLocaleDateString("es-AR")}</span>
                <span className="font-bold text-dark-800">{formatCurrency(selectedOrder.total)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
