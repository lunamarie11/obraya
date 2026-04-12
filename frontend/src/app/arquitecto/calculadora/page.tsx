"use client";

import { useState, useCallback } from "react";
import { ShoppingCart, Download, Users } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

// ── Types & Data ───────────────────────────────────────────────────────────
type ObraType = "casa" | "ampliacion" | "local" | "galpon" | "bano" | "garage";
type Nivel = "economico" | "estandar" | "premium";

interface MatRow {
  emoji: string;
  name: string;
  brand: string;
  qty: number;
  unit: string;
  subtotal: number;
}

const OBRA_TYPES: { id: ObraType; emoji: string; label: string }[] = [
  { id: "casa", emoji: "🏠", label: "Casa habitación" },
  { id: "ampliacion", emoji: "🧱", label: "Ampliación" },
  { id: "local", emoji: "🏪", label: "Local comercial" },
  { id: "galpon", emoji: "🏭", label: "Galpón / Depósito" },
  { id: "bano", emoji: "🚿", label: "Baño / Toilette" },
  { id: "garage", emoji: "🚗", label: "Garage" },
];

const NIVELES: { id: Nivel; emoji: string; label: string; desc: string }[] = [
  { id: "economico", emoji: "💰", label: "Económico", desc: "Materiales base" },
  { id: "estandar", emoji: "⭐", label: "Estándar", desc: "Calidad media" },
  { id: "premium", emoji: "💎", label: "Premium", desc: "Alta terminación" },
];

// [emoji, nombre, marca, coef_econ, coef_est, coef_prem, precio, unidad]
type CoefRow = [string, string, string, number, number, number, number, string];
const COEFS: CoefRow[] = [
  ["⚪", "Cemento Portland 50 kg", "Loma Negra", 7, 10, 12, 6800, "bolsa"],
  ["🪨", "Cal hidráulica 25 kg", "Calera Avellaneda", 1.5, 2.5, 3, 2800, "bolsa"],
  ["🏖", "Arena gruesa", "Corralón Del Sur", 0.06, 0.10, 0.12, 42000, "m³"],
  ["🧱", "Ladrillo común 6×12×18", "Cerámica Palermo", 45, 60, 65, 85, "unid."],
  ["🔩", "Hierro nervado Ø10mm", "Acindar", 2, 3.5, 4, 980, "kg"],
  ["🔩", "Hierro nervado Ø12mm", "Acindar", 1, 2, 3, 1120, "kg"],
  ["🟩", "Mezcla seca H-8", "PremixAr", 0.08, 0.11, 0.13, 38000, "m³"],
  ["🪣", "Yeso proyectable", "Durlock", 10, 14, 16, 520, "kg"],
  ["🟦", "Porcellanato 60×60", "San Lorenzo", 1.05, 1.10, 1.15, 3800, "caja"],
  ["🧱", "Pegamento cerámico", "Weber", 3.5, 4.5, 5, 1650, "kg"],
  ["🎨", "Pintura látex interior", "Sherwin-Williams", 0.20, 0.28, 0.35, 12500, "L"],
  ["🎨", "Impermeabilizante exterior", "Sinteplast", 0.22, 0.30, 0.38, 9800, "L"],
  ["🔵", "Membrana asfáltica 4mm", "Ormiflex", 0.18, 0.22, 0.25, 8500, "kg"],
];

const EXTRAS = [
  { id: "electrica", emoji: "⚡", label: "Eléctrica", name: "Cable unipolar 2.5mm IRAM", brand: "Prysmian", coef: [1.8, 2.5, 3.0], price: 980, unit: "m" },
  { id: "sanitaria", emoji: "🔧", label: "Plomería/Sanitaria", name: "Caño PVC 4\" sanitario", brand: "Fiplasma", coef: [0.3, 0.5, 0.6], price: 1850, unit: "m" },
  { id: "gas", emoji: "🔥", label: "Gas", name: "Caño de gas cobre 3/8\"", brand: "Cupralux", coef: [0.2, 0.3, 0.35], price: 2100, unit: "m" },
  { id: "clima", emoji: "❄️", label: "Climatización", name: "Split 3000 frigorías", brand: "Carrier", coef: [0.02, 0.025, 0.03], price: 280000, unit: "unid." },
];

const OBRA_MULT: Record<ObraType, number> = {
  casa: 1.0, ampliacion: 0.85, local: 0.9, galpon: 0.6, bano: 1.3, garage: 0.65,
};
const NIVEL_IDX: Record<Nivel, number> = { economico: 0, estandar: 1, premium: 2 };

const CONSTRUCTORES = [
  { name: "Carlos Méndez", rating: "⭐ 4.9 (312 reseñas)", works: "180 obras en ObraYa", price: "$950/m²", zone: "CABA y GBA Norte", avail: "Puede empezar en 3 días" },
  { name: "Jorge Sosa Construcciones", rating: "⭐ 4.7 (218 reseñas)", works: "142 obras en ObraYa", price: "$820/m²", zone: "GBA Sur y Oeste", avail: "Puede empezar en 1 semana" },
  { name: "Marta Ruiz & Asociados", rating: "⭐ 4.8 (156 reseñas)", works: "98 obras en ObraYa", price: "$1.050/m²", zone: "CABA zona norte", avail: "Puede empezar en 5 días" },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function CalculadoraPage() {
  const [obra, setObra] = useState<ObraType>("casa");
  const [nivel, setNivel] = useState<Nivel>("estandar");
  const [m2, setM2] = useState(80);
  const [plantas, setPlantas] = useState(1);
  const [extras, setExtras] = useState<Set<string>>(new Set(["electrica", "sanitaria"]));
  const [wantConstructor, setWantConstructor] = useState(false);
  const [toast, setToast] = useState("");

  const toggleExtra = (id: string) => {
    setExtras((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  // Calculate
  const totalM2 = m2 * plantas;
  const mult = OBRA_MULT[obra];
  const ni = NIVEL_IDX[nivel];
  const rows: MatRow[] = [];

  COEFS.forEach(([emoji, name, brand, ce, cs, cp, price, unit]) => {
    const coefs = [ce, cs, cp];
    const qty = Math.ceil(totalM2 * coefs[ni] * mult * 10) / 10;
    if (qty <= 0) return;
    rows.push({ emoji, name, brand, qty, unit, subtotal: Math.round(qty * price) });
  });

  EXTRAS.forEach((e) => {
    if (!extras.has(e.id)) return;
    const qty = Math.ceil(totalM2 * e.coef[ni] * mult * 10) / 10;
    rows.push({ emoji: e.emoji, name: e.name, brand: e.brand, qty, unit: e.unit, subtotal: Math.round(qty * e.price) });
  });

  const grand = rows.reduce((s, r) => s + r.subtotal, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-dark-800">🧮 Calculadora Llave en Mano</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ingresá los datos de tu obra y te mostramos qué materiales necesitás, con precios reales de hoy.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 max-w-6xl">
        {/* ── LEFT: Form ── */}
        <div className="space-y-4">
          {/* Tipo de obra */}
          <div className="card p-5">
            <h3 className="font-bold text-sm text-dark-800 mb-3">🏗 Tipo de obra</h3>
            <div className="grid grid-cols-3 gap-2">
              {OBRA_TYPES.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setObra(o.id)}
                  className={cn(
                    "p-3 rounded-xl border-2 text-center text-xs font-semibold transition-all",
                    obra === o.id
                      ? "border-navy-500 bg-navy-50 text-navy-500"
                      : "border-gray-200 bg-gray-50 text-gray-600 hover:border-navy-500 hover:bg-navy-50"
                  )}
                >
                  <div className="text-xl mb-1">{o.emoji}</div>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dimensiones */}
          <div className="card p-5">
            <h3 className="font-bold text-sm text-dark-800 mb-3">📐 Dimensiones</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">Superficie (m²)</label>
                <input
                  type="number"
                  min={10}
                  max={5000}
                  value={m2}
                  onChange={(e) => setM2(Math.max(10, Number(e.target.value)))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-navy-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">Plantas / niveles</label>
                <select
                  value={plantas}
                  onChange={(e) => setPlantas(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-navy-500"
                >
                  <option value={1}>1 planta</option>
                  <option value={2}>2 plantas</option>
                  <option value={3}>3 plantas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Nivel terminación */}
          <div className="card p-5">
            <h3 className="font-bold text-sm text-dark-800 mb-3">✨ Nivel de terminación</h3>
            <div className="grid grid-cols-3 gap-2">
              {NIVELES.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setNivel(n.id)}
                  className={cn(
                    "p-3 rounded-xl border-2 text-center transition-all",
                    nivel === n.id
                      ? "border-navy-500 bg-navy-50"
                      : "border-gray-200 hover:border-navy-500"
                  )}
                >
                  <div className="text-xl mb-1">{n.emoji}</div>
                  <div className="text-xs font-bold text-dark-800">{n.label}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{n.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Instalaciones */}
          <div className="card p-5">
            <h3 className="font-bold text-sm text-dark-800 mb-3">⚡ Instalaciones a incluir</h3>
            <div className="flex flex-wrap gap-2">
              {EXTRAS.map((e) => (
                <label
                  key={e.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs font-medium transition-all",
                    extras.has(e.id)
                      ? "border-navy-500 bg-navy-50 text-navy-500"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={extras.has(e.id)}
                    onChange={() => toggleExtra(e.id)}
                    className="accent-blue-500"
                  />
                  {e.emoji} {e.label}
                </label>
              ))}
            </div>
          </div>

          {/* Constructor */}
          <div className="card p-5 bg-gradient-to-br from-success-50 to-success-50 border-success-500/20">
            <h3 className="font-bold text-sm text-success-500 mb-2">👷 ¿Necesitás constructor?</h3>
            <p className="text-xs text-gray-600 mb-3">
              Conectamos tu proyecto con constructores certificados ObraYa en tu zona.
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={wantConstructor}
                onChange={(e) => setWantConstructor(e.target.checked)}
                className="accent-emerald-500 w-4 h-4"
              />
              <span className="text-sm font-semibold text-success-500">
                Sí, quiero solicitar un constructor
              </span>
            </label>
          </div>
        </div>

        {/* ── RIGHT: Results ── */}
        <div>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Total materiales", value: formatCurrency(grand) },
              { label: "Ítems de insumos", value: rows.length.toString() },
              { label: "Tiempo de entrega", value: "<4 hs" },
            ].map((k) => (
              <div key={k.label} className="card p-4 text-center">
                <div className="text-lg font-extrabold text-navy-500">{k.value}</div>
                <div className="text-[11px] text-gray-400 mt-1">{k.label}</div>
              </div>
            ))}
          </div>

          {/* Materials table */}
          <div className="card overflow-hidden mb-3">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <span className="font-bold text-sm text-dark-800">📦 Lista de materiales</span>
              <button
                onClick={() => showToast("📄 Generando presupuesto PDF...")}
                className="flex items-center gap-1.5 text-xs font-semibold text-navy-500 bg-navy-50 hover:bg-navy-100 px-3 py-1.5 rounded-lg border border-navy-100 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Exportar PDF
              </button>
            </div>

            {/* Header row */}
            <div className="grid grid-cols-[2rem_1fr_5rem_6rem] gap-2 px-5 py-2 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <span />
              <span>Material</span>
              <span className="text-right">Cantidad</span>
              <span className="text-right">Subtotal</span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
              {rows.map((r, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[2rem_1fr_5rem_6rem] gap-2 px-5 py-2.5 items-center hover:bg-gray-50 text-sm"
                >
                  <span className="text-lg">{r.emoji}</span>
                  <div>
                    <div className="font-medium text-dark-800 text-xs leading-snug">{r.name}</div>
                    <div className="text-[10px] text-gray-400">{r.brand}</div>
                  </div>
                  <div className="text-right text-xs text-gray-600">
                    {r.qty} {r.unit}
                  </div>
                  <div className="text-right font-bold text-dark-800 text-xs">
                    {formatCurrency(r.subtotal)}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer total */}
            <div className="px-5 py-3 bg-gray-50 border-t-2 border-navy-500 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-gray-400">Precios al día de hoy · Incluye IVA</div>
                <div className="text-[11px] text-success-500 font-medium mt-0.5">✓ Todo disponible en stock para tu zona</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">TOTAL</div>
                <div className="text-xl font-extrabold text-dark-800">{formatCurrency(grand)}</div>
              </div>
            </div>
          </div>

          {/* Add all to cart */}
          <button
            onClick={() => showToast(`✅ ${rows.length} materiales agregados al carrito`)}
            className="w-full bg-navy-500 hover:bg-navy-600 text-white font-bold py-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" /> Agregar todo al carrito
          </button>
          <p className="text-[11px] text-gray-400 text-center mt-2">
            Podés ajustar cantidades desde el carrito antes de confirmar
          </p>

          {/* Constructors */}
          {wantConstructor && (
            <div className="mt-4 card p-5 bg-gradient-to-br from-success-50 to-success-50 border-success-500/20">
              <div className="flex items-center gap-2 font-bold text-success-500 mb-4">
                <Users className="w-4 h-4" /> Constructores disponibles en tu zona
              </div>
              <div className="space-y-3">
                {CONSTRUCTORES.map((c) => (
                  <div key={c.name} className="bg-white border border-success-500/20 rounded-xl p-3.5 flex items-start gap-3">
                    <div className="text-2xl shrink-0">👷</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-dark-800">{c.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{c.rating} · {c.works}</div>
                      <div className="text-xs text-gray-400 mt-0.5">📍 {c.zone} · {c.avail}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-extrabold text-success-500 text-sm mb-2">{c.price}</div>
                      <button
                        onClick={() => showToast(`👷 Solicitud enviada a ${c.name}`)}
                        className="bg-success-500 hover:bg-success-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Contratar →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-dark-900 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-xl z-50 flex items-center gap-2">
          {toast}
        </div>
      )}
    </div>
  );
}
