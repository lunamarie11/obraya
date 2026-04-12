"use client";

import { useState, useEffect, useRef } from "react";
import {
  Truck, MapPin, Clock, Phone, Package, CheckCircle2,
  AlertTriangle, Navigation, RefreshCw, ChevronRight,
  Thermometer, Gauge, Route, Users,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────
type DeliveryStatus = "en_deposito" | "en_camino" | "entregando" | "entregado" | "demorado";

interface Driver {
  id: number;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  rating: number;
  deliveries: number;
}

interface Delivery {
  id: string;
  orderId: string;
  customer: string;
  address: string;
  zone: string;
  status: DeliveryStatus;
  driver: Driver;
  items: number;
  totalWeight: string;
  estimatedTime: string;
  departedAt: string | null;
  lat: number;
  lng: number;
  destLat: number;
  destLng: number;
  progress: number; // 0-100
  distanceKm: number;
  tempC: number | null;
}

// ── Mock Data ──────────────────────────────────────────────────────────────
const DRIVERS: Driver[] = [
  { id: 1, name: "Ricardo Gómez", phone: "+54 11 5555-1234", vehicle: "Ford Cargo 1722", plate: "AD 123 FG", rating: 4.9, deliveries: 1842 },
  { id: 2, name: "Miguel Torres", phone: "+54 11 5555-5678", vehicle: "Mercedes Atego 1726", plate: "AE 456 HJ", rating: 4.7, deliveries: 1203 },
  { id: 3, name: "Pablo Fernández", phone: "+54 11 5555-9012", vehicle: "Iveco Tector 170E22", plate: "AF 789 KL", rating: 4.8, deliveries: 967 },
  { id: 4, name: "Andrés López", phone: "+54 11 5555-3456", vehicle: "Scania P250", plate: "AG 012 MN", rating: 4.6, deliveries: 2104 },
];

const DELIVERIES: Delivery[] = [
  { id: "ENV-001", orderId: "ORD-2847", customer: "Constructora Del Sur S.A.", address: "Av. Rivadavia 4521, CABA", zone: "CABA Centro", status: "en_camino", driver: DRIVERS[0], items: 24, totalWeight: "2.8 ton", estimatedTime: "14:30", departedAt: "12:45", lat: -34.6118, lng: -58.4173, destLat: -34.6207, destLng: -58.4466, progress: 62, distanceKm: 3.2, tempC: null },
  { id: "ENV-002", orderId: "ORD-2851", customer: "Arq. Marina Rodríguez", address: "Calle 45 #1280, La Plata", zone: "GBA Sur", status: "entregando", driver: DRIVERS[1], items: 8, totalWeight: "1.2 ton", estimatedTime: "13:15", departedAt: "10:30", lat: -34.9214, lng: -57.9544, destLat: -34.9214, destLng: -57.9544, progress: 95, distanceKm: 0.1, tempC: null },
  { id: "ENV-003", orderId: "ORD-2853", customer: "Inmobiliaria Costa Group", address: "Av. Santa Fe 3200, Palermo", zone: "CABA Norte", status: "demorado", driver: DRIVERS[2], items: 45, totalWeight: "5.1 ton", estimatedTime: "13:00", departedAt: "11:15", lat: -34.5875, lng: -58.4108, destLat: -34.5955, destLng: -58.4096, progress: 78, distanceKm: 1.8, tempC: 32 },
  { id: "ENV-004", orderId: "ORD-2856", customer: "Juan Martínez", address: "Monroe 2845, Belgrano", zone: "CABA Norte", status: "en_deposito", driver: DRIVERS[3], items: 12, totalWeight: "0.8 ton", estimatedTime: "16:00", departedAt: null, lat: -34.5610, lng: -58.4570, destLat: -34.5629, destLng: -58.4597, progress: 0, distanceKm: 12.5, tempC: null },
  { id: "ENV-005", orderId: "ORD-2842", customer: "Desarrollos MNP", address: "Blvd. San Juan 1100, Córdoba", zone: "Interior", status: "entregado", driver: DRIVERS[0], items: 60, totalWeight: "8.4 ton", estimatedTime: "11:00", departedAt: "07:00", lat: -31.4135, lng: -64.1811, destLat: -31.4135, destLng: -64.1811, progress: 100, distanceKm: 0, tempC: null },
  { id: "ENV-006", orderId: "ORD-2859", customer: "Cooperativa La Unión", address: "Av. Perón 580, San Martín", zone: "GBA Oeste", status: "en_camino", driver: DRIVERS[3], items: 32, totalWeight: "3.6 ton", estimatedTime: "15:45", departedAt: "14:00", lat: -34.5782, lng: -58.5340, destLat: -34.5722, destLng: -58.5413, progress: 35, distanceKm: 5.7, tempC: null },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function statusConfig(s: DeliveryStatus) {
  switch (s) {
    case "en_deposito": return { label: "En depósito", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400", mapColor: "#9CA3AF" };
    case "en_camino": return { label: "En camino", color: "bg-info-50 text-info-500", dot: "bg-info-500", mapColor: "#2980B9" };
    case "entregando": return { label: "Entregando", color: "bg-warning-50 text-warning-500", dot: "bg-warning-500", mapColor: "#F39C12" };
    case "entregado": return { label: "Entregado", color: "bg-success-50 text-success-500", dot: "bg-success-500", mapColor: "#27AE60" };
    case "demorado": return { label: "Demorado", color: "bg-danger-50 text-danger-500", dot: "bg-danger-500", mapColor: "#E74C3C" };
  }
}

// ── Map Component (SVG-based) ──────────────────────────────────────────────
function LiveMap({ deliveries, selected, onSelect }: { deliveries: Delivery[]; selected: string | null; onSelect: (id: string) => void }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => !p), 1500);
    return () => clearInterval(interval);
  }, []);

  // Map bounds (Buenos Aires area roughly)
  const minLat = -35.0, maxLat = -34.5;
  const minLng = -58.6, maxLng = -57.9;

  function toX(lng: number) { return ((lng - minLng) / (maxLng - minLng)) * 100; }
  function toY(lat: number) { return ((lat - minLat) / (maxLat - minLat)) * 100; }

  const activeDeliveries = deliveries.filter((d) => d.status !== "entregado" && d.status !== "en_deposito");

  return (
    <div className="relative w-full h-full bg-[#1a1a2e] rounded-xl overflow-hidden">
      {/* Grid overlay */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid lines */}
        {Array.from({ length: 20 }).map((_, i) => (
          <g key={i}>
            <line x1={i * 5} y1={0} x2={i * 5} y2={100} stroke="#ffffff08" strokeWidth={0.2} />
            <line x1={0} y1={i * 5} x2={100} y2={i * 5} stroke="#ffffff08" strokeWidth={0.2} />
          </g>
        ))}

        {/* Roads (simplified) */}
        <line x1={20} y1={10} x2={20} y2={90} stroke="#ffffff15" strokeWidth={0.5} />
        <line x1={40} y1={5} x2={40} y2={95} stroke="#ffffff15" strokeWidth={0.5} />
        <line x1={60} y1={15} x2={60} y2={85} stroke="#ffffff15" strokeWidth={0.5} />
        <line x1={80} y1={10} x2={80} y2={90} stroke="#ffffff15" strokeWidth={0.5} />
        <line x1={5} y1={30} x2={95} y2={30} stroke="#ffffff15" strokeWidth={0.5} />
        <line x1={10} y1={50} x2={90} y2={50} stroke="#ffffff15" strokeWidth={0.5} />
        <line x1={5} y1={70} x2={95} y2={70} stroke="#ffffff15" strokeWidth={0.5} />

        {/* Delivery routes & positions */}
        {activeDeliveries.map((d) => {
          const x = toX(d.lng);
          const y = 100 - toY(d.lat);
          const dx = toX(d.destLng);
          const dy = 100 - toY(d.destLat);
          const sc = statusConfig(d.status);
          const isSelected = selected === d.id;

          return (
            <g key={d.id} className="cursor-pointer" onClick={() => onSelect(d.id)}>
              {/* Route line */}
              <line x1={x} y1={y} x2={dx} y2={dy} stroke={sc.mapColor} strokeWidth={isSelected ? 0.8 : 0.4} strokeDasharray="1.5,1" opacity={0.6} />

              {/* Destination marker */}
              <circle cx={dx} cy={dy} r={isSelected ? 1.8 : 1.2} fill="none" stroke={sc.mapColor} strokeWidth={0.3} opacity={0.5} />

              {/* Vehicle position - pulsing */}
              <circle cx={x} cy={y} r={isSelected ? 3.5 : 2.5} fill={sc.mapColor} opacity={pulse ? 0.15 : 0.08} />
              <circle cx={x} cy={y} r={isSelected ? 2 : 1.5} fill={sc.mapColor} opacity={0.4} />
              <circle cx={x} cy={y} r={isSelected ? 1.2 : 0.8} fill={sc.mapColor} />

              {/* Label */}
              {isSelected && (
                <text x={x + 2.5} y={y - 2} fill="white" fontSize={2.5} fontWeight="bold" fontFamily="system-ui">
                  {d.id}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Map legend */}
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex gap-4">
        {(["en_camino", "entregando", "demorado"] as DeliveryStatus[]).map((s) => {
          const sc = statusConfig(s);
          return (
            <div key={s} className="flex items-center gap-1.5 text-[10px] text-white/70">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.mapColor }} />
              {sc.label}
            </div>
          );
        })}
      </div>

      {/* Live indicator */}
      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
        <span className={cn("w-2 h-2 rounded-full bg-success-500 transition-opacity", pulse ? "opacity-100" : "opacity-30")} />
        <span className="text-[10px] text-white/70 font-semibold">EN VIVO</span>
      </div>

      {/* Warehouse marker */}
      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
        <Package className="w-3 h-3 text-accent-500" />
        <span className="text-[10px] text-white/70 font-medium">Depósito Central · Avellaneda</span>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function LogisticaPage() {
  const [selected, setSelected] = useState<string | null>("ENV-001");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "todos">("todos");

  // Simulate real-time updates
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => setLastUpdate(new Date()), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filtered = statusFilter === "todos"
    ? DELIVERIES
    : DELIVERIES.filter((d) => d.status === statusFilter);

  const selectedDelivery = selected ? DELIVERIES.find((d) => d.id === selected) : null;

  // KPIs
  const active = DELIVERIES.filter((d) => d.status === "en_camino" || d.status === "entregando").length;
  const delayed = DELIVERIES.filter((d) => d.status === "demorado").length;
  const delivered = DELIVERIES.filter((d) => d.status === "entregado").length;
  const pending = DELIVERIES.filter((d) => d.status === "en_deposito").length;

  return (
    <div className="p-8 h-[calc(100vh-0px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-dark-800">🚚 Logística en Tiempo Real</h1>
          <p className="text-sm text-gray-500 mt-1">
            Seguimiento GPS de entregas · Última actualización: {lastUpdate.toLocaleTimeString("es-AR")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              autoRefresh ? "bg-success-50 text-success-500" : "bg-gray-100 text-gray-500"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", autoRefresh && "animate-spin")} style={autoRefresh ? { animationDuration: "3s" } : {}} />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { icon: Truck, label: "En tránsito", value: active, color: "text-info-500", bg: "bg-info-50" },
          { icon: AlertTriangle, label: "Demorados", value: delayed, color: "text-danger-500", bg: "bg-danger-50" },
          { icon: CheckCircle2, label: "Entregados hoy", value: delivered, color: "text-success-500", bg: "bg-success-50" },
          { icon: Package, label: "En depósito", value: pending, color: "text-gray-500", bg: "bg-gray-100" },
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

      {/* Main layout: Map + Sidebar */}
      <div className="flex-1 grid grid-cols-[1fr_380px] gap-4 min-h-0">
        {/* Map */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 min-h-0">
            <LiveMap deliveries={DELIVERIES} selected={selected} onSelect={setSelected} />
          </div>

          {/* Selected delivery detail bar */}
          {selectedDelivery && (
            <div className="card p-4 flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center">
                  <Truck className="w-5 h-5 text-navy-500" />
                </div>
                <div>
                  <div className="font-bold text-sm text-dark-800">{selectedDelivery.id}</div>
                  <div className="text-[11px] text-gray-400">{selectedDelivery.driver.name}</div>
                </div>
              </div>

              <div className="h-8 w-px bg-gray-200" />

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-600 truncate">{selectedDelivery.address}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      selectedDelivery.status === "demorado" ? "bg-danger-500" :
                      selectedDelivery.status === "entregado" ? "bg-success-500" : "bg-info-500"
                    )}
                    style={{ width: `${selectedDelivery.progress}%` }}
                  />
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs text-gray-400">ETA</div>
                <div className="text-lg font-extrabold text-dark-800">{selectedDelivery.estimatedTime}</div>
              </div>

              <div className="flex gap-2 shrink-0">
                <button className="p-2 rounded-lg bg-navy-50 hover:bg-navy-100 text-navy-500 transition-colors">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg bg-navy-50 hover:bg-navy-100 text-navy-500 transition-colors">
                  <Navigation className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Deliveries sidebar */}
        <div className="card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-dark-800">Entregas del día</h3>
              <span className="text-[10px] font-bold text-gray-400">{DELIVERIES.length} envíos</span>
            </div>
            <div className="flex gap-1">
              {(["todos", "en_camino", "entregando", "demorado", "en_deposito", "entregado"] as const).map((s) => {
                const count = s === "todos" ? DELIVERIES.length : DELIVERIES.filter((d) => d.status === s).length;
                const sc = s === "todos" ? null : statusConfig(s);
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] font-semibold transition-all",
                      statusFilter === s
                        ? "bg-navy-500 text-white"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {s === "todos" ? "Todos" : sc?.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map((d) => {
              const sc = statusConfig(d.status);
              const isSelected = selected === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelected(d.id)}
                  className={cn(
                    "px-4 py-3 border-b border-gray-50 cursor-pointer transition-all hover:bg-gray-50",
                    isSelected && "bg-navy-50/50 border-l-2 border-l-navy-500"
                  )}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-dark-800">{d.id}</span>
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold", sc.color)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                          {sc.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{d.customer}</div>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 text-gray-300 transition-transform", isSelected && "rotate-90 text-navy-500")} />
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-2">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{d.address}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1 text-gray-400">
                        <Package className="w-3 h-3" /> {d.items} ítems
                      </span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <Gauge className="w-3 h-3" /> {d.totalWeight}
                      </span>
                      {d.distanceKm > 0 && (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Route className="w-3 h-3" /> {d.distanceKm} km
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="font-semibold text-dark-800">{d.estimatedTime}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {d.status !== "en_deposito" && (
                    <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", d.status === "demorado" ? "bg-danger-500" : d.status === "entregado" ? "bg-success-500" : "bg-info-500")}
                        style={{ width: `${d.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Driver info on selected */}
                  {isSelected && (
                    <div className="mt-3 p-2.5 bg-gray-50 rounded-lg flex items-center gap-3">
                      <div className="w-8 h-8 bg-navy-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {d.driver.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-dark-800">{d.driver.name}</div>
                        <div className="text-[10px] text-gray-400">{d.driver.vehicle} · {d.driver.plate}</div>
                      </div>
                      <button className="p-1.5 rounded-lg bg-success-500 text-white">
                        <Phone className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {DRIVERS.length} choferes activos
              </span>
              <span className="flex items-center gap-1">
                <Truck className="w-3 h-3" /> {active + delayed} vehículos en ruta
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
