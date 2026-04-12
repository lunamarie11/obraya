"use client";

import { useState } from "react";
import {
  Building2, FileText, Camera, Users, ChevronRight, Plus,
  Download, Eye, Clock, CheckCircle2, AlertTriangle, MapPin,
  Calendar, DollarSign, Paperclip, Image, Upload, Star,
  Phone, Mail, Shield, TrendingUp, Ruler, HardHat,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────
type ObraStatus = "en_curso" | "pausada" | "finalizada" | "permiso_pendiente";
type EtapaStatus = "completada" | "en_curso" | "pendiente" | "bloqueada";
type DocType = "plano" | "permiso" | "contrato" | "certificado" | "presupuesto";

interface Etapa {
  id: number;
  name: string;
  status: EtapaStatus;
  progress: number;
  startDate: string;
  endDate: string;
  contractor: string;
  photos: number;
  budget: number;
  spent: number;
}

interface Document {
  id: number;
  name: string;
  type: DocType;
  version: string;
  date: string;
  author: string;
  size: string;
}

interface Contractor {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  phone: string;
  email: string;
  activeStages: string[];
  totalPaid: number;
  pendingPayment: number;
  certExpiry: string;
  status: "activo" | "pendiente_pago" | "finalizado";
}

interface Obra {
  id: number;
  name: string;
  address: string;
  client: string;
  status: ObraStatus;
  progress: number;
  startDate: string;
  endDate: string;
  totalBudget: number;
  spent: number;
  m2: number;
  stages: Etapa[];
  documents: Document[];
  contractors: Contractor[];
  recentPhotos: { url: string; caption: string; date: string; stage: string }[];
}

// ── Mock Data ──────────────────────────────────────────────────────────────
const OBRAS: Obra[] = [
  {
    id: 1,
    name: "Edificio Palermo Green",
    address: "Av. Santa Fe 4200, Palermo, CABA",
    client: "Inmobiliaria Costa Group",
    status: "en_curso",
    progress: 68,
    startDate: "2025-09-15",
    endDate: "2026-08-30",
    totalBudget: 185000000,
    spent: 124500000,
    m2: 2400,
    stages: [
      { id: 1, name: "Excavación y fundaciones", status: "completada", progress: 100, startDate: "2025-09-15", endDate: "2025-11-20", contractor: "Carlos Méndez", photos: 48, budget: 28000000, spent: 27200000 },
      { id: 2, name: "Estructura hormigón", status: "completada", progress: 100, startDate: "2025-11-25", endDate: "2026-02-10", contractor: "Jorge Sosa Construcciones", photos: 72, budget: 52000000, spent: 51800000 },
      { id: 3, name: "Mampostería y cerramientos", status: "en_curso", progress: 75, startDate: "2026-02-15", endDate: "2026-05-20", contractor: "Jorge Sosa Construcciones", photos: 34, budget: 35000000, spent: 26200000 },
      { id: 4, name: "Instalaciones (elect/sanit/gas)", status: "en_curso", progress: 40, startDate: "2026-03-01", endDate: "2026-06-15", contractor: "Electro Sur SRL", photos: 18, budget: 28000000, spent: 11200000 },
      { id: 5, name: "Revestimientos y pisos", status: "pendiente", progress: 0, startDate: "2026-05-25", endDate: "2026-07-15", contractor: "Marta Ruiz & Asoc.", photos: 0, budget: 22000000, spent: 0 },
      { id: 6, name: "Pintura y terminaciones", status: "pendiente", progress: 0, startDate: "2026-07-01", endDate: "2026-08-15", contractor: "Marta Ruiz & Asoc.", photos: 0, budget: 12000000, spent: 0 },
      { id: 7, name: "Limpieza final y entrega", status: "pendiente", progress: 0, startDate: "2026-08-15", endDate: "2026-08-30", contractor: "Carlos Méndez", photos: 0, budget: 8000000, spent: 0 },
    ],
    documents: [
      { id: 1, name: "Plano General Planta Baja v3", type: "plano", version: "v3.2", date: "2025-08-20", author: "Arq. Marina Rodríguez", size: "4.2 MB" },
      { id: 2, name: "Plano Estructural Losa Tipo", type: "plano", version: "v2.1", date: "2025-09-05", author: "Ing. Pablo Fernández", size: "3.8 MB" },
      { id: 3, name: "Plano Instalación Eléctrica", type: "plano", version: "v1.4", date: "2026-01-15", author: "Ing. Luis Martín", size: "2.1 MB" },
      { id: 4, name: "Permiso Municipal de Obra", type: "permiso", version: "—", date: "2025-08-01", author: "Municipalidad CABA", size: "1.2 MB" },
      { id: 5, name: "Certificado Apto Ambiental", type: "permiso", version: "—", date: "2025-07-15", author: "Min. Ambiente CABA", size: "0.8 MB" },
      { id: 6, name: "Contrato Jorge Sosa Const.", type: "contrato", version: "v1.0", date: "2025-11-01", author: "Estudio Legal VM", size: "0.5 MB" },
      { id: 7, name: "Certificado de Obra #5 - Marzo", type: "certificado", version: "—", date: "2026-03-30", author: "Arq. Marina Rodríguez", size: "0.3 MB" },
      { id: 8, name: "Presupuesto Revestimientos", type: "presupuesto", version: "v2.0", date: "2026-04-01", author: "Marta Ruiz & Asoc.", size: "0.4 MB" },
    ],
    contractors: [
      { id: 1, name: "Carlos Méndez", specialty: "Obra gruesa y fundaciones", rating: 4.9, phone: "+54 11 5555-1234", email: "cmendez@obra.com", activeStages: ["Limpieza final y entrega"], totalPaid: 26500000, pendingPayment: 700000, certExpiry: "2026-12-31", status: "activo" },
      { id: 2, name: "Jorge Sosa Construcciones", specialty: "Estructura y mampostería", rating: 4.7, phone: "+54 11 5555-5678", email: "jsosa@construcciones.com", activeStages: ["Mampostería y cerramientos"], totalPaid: 68000000, pendingPayment: 10000000, certExpiry: "2027-03-15", status: "activo" },
      { id: 3, name: "Electro Sur SRL", specialty: "Instalaciones eléctricas, sanitarias y gas", rating: 4.8, phone: "+54 11 5555-9012", email: "info@electrosur.com", activeStages: ["Instalaciones (elect/sanit/gas)"], totalPaid: 11200000, pendingPayment: 16800000, certExpiry: "2026-09-30", status: "activo" },
      { id: 4, name: "Marta Ruiz & Asociados", specialty: "Revestimientos y terminaciones", rating: 4.8, phone: "+54 11 5555-3456", email: "mruiz@asociados.com", activeStages: [], totalPaid: 0, pendingPayment: 0, certExpiry: "2027-01-20", status: "pendiente_pago" },
    ],
    recentPhotos: [
      { url: "📸", caption: "Mampostería piso 6 - Frente norte", date: "2026-04-11", stage: "Mampostería" },
      { url: "📸", caption: "Tendido eléctrico piso 3", date: "2026-04-10", stage: "Instalaciones" },
      { url: "📸", caption: "Cerramientos ventanas piso 5", date: "2026-04-09", stage: "Mampostería" },
      { url: "📸", caption: "Cañería sanitaria piso 4", date: "2026-04-08", stage: "Instalaciones" },
      { url: "📸", caption: "Vista aérea drone - avance general", date: "2026-04-07", stage: "General" },
      { url: "📸", caption: "Columnas piso 7 - encofrado", date: "2026-04-05", stage: "Mampostería" },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function obraStatusConfig(s: ObraStatus) {
  switch (s) {
    case "en_curso": return { label: "En curso", color: "bg-success-50 text-success-500", dot: "bg-success-500" };
    case "pausada": return { label: "Pausada", color: "bg-warning-50 text-warning-500", dot: "bg-warning-500" };
    case "finalizada": return { label: "Finalizada", color: "bg-info-50 text-info-500", dot: "bg-info-500" };
    case "permiso_pendiente": return { label: "Permiso pendiente", color: "bg-danger-50 text-danger-500", dot: "bg-danger-500" };
  }
}

function etapaStatusConfig(s: EtapaStatus) {
  switch (s) {
    case "completada": return { label: "Completada", color: "bg-success-50 text-success-500", dot: "bg-success-500" };
    case "en_curso": return { label: "En curso", color: "bg-info-50 text-info-500", dot: "bg-info-500" };
    case "pendiente": return { label: "Pendiente", color: "bg-gray-100 text-gray-500", dot: "bg-gray-400" };
    case "bloqueada": return { label: "Bloqueada", color: "bg-danger-50 text-danger-500", dot: "bg-danger-500" };
  }
}

function docIcon(t: DocType) {
  switch (t) {
    case "plano": return "📐";
    case "permiso": return "🏛";
    case "contrato": return "📝";
    case "certificado": return "✅";
    case "presupuesto": return "💰";
  }
}

function contractorStatusConfig(s: Contractor["status"]) {
  switch (s) {
    case "activo": return { label: "Activo", color: "bg-success-50 text-success-500" };
    case "pendiente_pago": return { label: "Pago pendiente", color: "bg-warning-50 text-warning-500" };
    case "finalizado": return { label: "Finalizado", color: "bg-gray-100 text-gray-500" };
  }
}

// ── Tabs ────────────────────────────────────────────────────────────────────
type Tab = "etapas" | "planos" | "fotos" | "contratistas";

// ── Component ──────────────────────────────────────────────────────────────
export default function ObrasPage() {
  const [activeTab, setActiveTab] = useState<Tab>("etapas");
  const obra = OBRAS[0]; // Demo: single obra
  const sc = obraStatusConfig(obra.status);
  const budgetPercent = (obra.spent / obra.totalBudget) * 100;

  const TABS: { id: Tab; label: string; icon: typeof Building2; count?: number }[] = [
    { id: "etapas", label: "Etapas de obra", icon: TrendingUp, count: obra.stages.length },
    { id: "planos", label: "Planos y documentos", icon: FileText, count: obra.documents.length },
    { id: "fotos", label: "Avance fotográfico", icon: Camera, count: obra.recentPhotos.length },
    { id: "contratistas", label: "Contratistas", icon: Users, count: obra.contractors.length },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-dark-800">🏗 Gestión de Obras</h1>
          <p className="text-sm text-gray-500 mt-1">Panel de arquitecto · Control integral de proyectos</p>
        </div>
        <button className="flex items-center gap-2 bg-navy-500 hover:bg-navy-600 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors">
          <Plus className="w-4 h-4" /> Nueva Obra
        </button>
      </div>

      {/* Obra Header Card */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-navy-50 rounded-2xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-navy-500" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-extrabold text-dark-800">{obra.name}</h2>
                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold", sc.color)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                  {sc.label}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {obra.address}</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {obra.client}</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: "Avance general", value: `${obra.progress}%`, sub: <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1"><div className="h-full bg-success-500 rounded-full" style={{ width: `${obra.progress}%` }} /></div> },
            { label: "Presupuesto total", value: formatCurrency(obra.totalBudget), sub: <span className="text-[10px] text-gray-400">Ejecutado: {budgetPercent.toFixed(0)}%</span> },
            { label: "Ejecutado", value: formatCurrency(obra.spent), sub: <span className={cn("text-[10px] font-semibold", budgetPercent > 90 ? "text-danger-500" : "text-success-500")}>{budgetPercent > 90 ? "⚠ Cerca del límite" : "✓ Dentro del presupuesto"}</span> },
            { label: "Superficie", value: `${obra.m2.toLocaleString()} m²`, sub: <span className="text-[10px] text-gray-400">Costo/m²: {formatCurrency(Math.round(obra.spent / obra.m2))}</span> },
            { label: "Plazo", value: `${obra.startDate.slice(0, 7)} → ${obra.endDate.slice(0, 7)}`, sub: <span className="text-[10px] text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {Math.round((new Date(obra.endDate).getTime() - Date.now()) / 86400000)} días restantes</span> },
          ].map((k) => (
            <div key={k.label} className="bg-gray-50 rounded-xl p-3.5">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{k.label}</div>
              <div className="text-base font-extrabold text-dark-800">{k.value}</div>
              {k.sub}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all",
              activeTab === t.id ? "bg-white text-dark-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count !== undefined && (
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", activeTab === t.id ? "bg-navy-50 text-navy-500" : "bg-gray-200 text-gray-500")}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Etapas ── */}
      {activeTab === "etapas" && (
        <div className="space-y-3">
          {obra.stages.map((stage, idx) => {
            const esc = etapaStatusConfig(stage.status);
            const budgetPct = stage.budget > 0 ? (stage.spent / stage.budget * 100) : 0;
            return (
              <div key={stage.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center pt-1">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
                      stage.status === "completada" ? "bg-success-500" :
                      stage.status === "en_curso" ? "bg-info-500" :
                      stage.status === "bloqueada" ? "bg-danger-500" : "bg-gray-300"
                    )}>
                      {stage.status === "completada" ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    {idx < obra.stages.length - 1 && <div className="w-0.5 h-8 bg-gray-200 mt-1" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-dark-800">{stage.name}</h3>
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold", esc.color)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", esc.dot)} />
                          {esc.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Camera className="w-3.5 h-3.5" /> {stage.photos} fotos</span>
                        <span className="flex items-center gap-1"><HardHat className="w-3.5 h-3.5" /> {stage.contractor}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {stage.startDate} → {stage.endDate}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all",
                            stage.status === "completada" ? "bg-success-500" :
                            stage.status === "en_curso" ? "bg-info-500" : "bg-gray-300"
                          )}
                          style={{ width: `${stage.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-dark-800 w-12 text-right">{stage.progress}%</span>
                    </div>

                    {/* Budget */}
                    <div className="flex items-center gap-6 text-xs">
                      <span className="text-gray-500">Presupuesto: <strong className="text-dark-800">{formatCurrency(stage.budget)}</strong></span>
                      <span className="text-gray-500">Ejecutado: <strong className={cn(budgetPct > 95 ? "text-danger-500" : "text-dark-800")}>{formatCurrency(stage.spent)}</strong></span>
                      <span className={cn("font-semibold", budgetPct > 95 ? "text-danger-500" : budgetPct > 80 ? "text-warning-500" : "text-success-500")}>
                        {budgetPct.toFixed(0)}% del presupuesto
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tab: Planos y documentos ── */}
      {activeTab === "planos" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {(["todos", "plano", "permiso", "contrato", "certificado", "presupuesto"] as const).map((t) => (
                <button key={t} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors capitalize">
                  {t === "todos" ? "Todos" : t + "s"}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 bg-navy-500 hover:bg-navy-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
              <Upload className="w-4 h-4" /> Subir documento
            </button>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Documento</th>
                  <th className="text-left px-3 py-3">Tipo</th>
                  <th className="text-left px-3 py-3">Versión</th>
                  <th className="text-left px-3 py-3">Fecha</th>
                  <th className="text-left px-3 py-3">Autor</th>
                  <th className="text-right px-3 py-3">Tamaño</th>
                  <th className="text-center px-3 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {obra.documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{docIcon(doc.type)}</span>
                        <span className="font-semibold text-dark-800">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 capitalize text-xs text-gray-500">{doc.type}</td>
                    <td className="px-3 py-3.5">
                      <span className="bg-navy-50 text-navy-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{doc.version}</span>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-gray-500">{doc.date}</td>
                    <td className="px-3 py-3.5 text-xs text-gray-500">{doc.author}</td>
                    <td className="px-3 py-3.5 text-right text-xs text-gray-400">{doc.size}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-navy-50 text-gray-400 hover:text-navy-500 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-navy-50 text-gray-400 hover:text-navy-500 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Fotos ── */}
      {activeTab === "fotos" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">Registro fotográfico del avance · {obra.stages.reduce((s, st) => s + st.photos, 0)} fotos totales</p>
            <button className="flex items-center gap-2 bg-navy-500 hover:bg-navy-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
              <Camera className="w-4 h-4" /> Subir fotos
            </button>
          </div>

          {/* Photo grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {obra.recentPhotos.map((photo, idx) => (
              <div key={idx} className="card overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-6xl relative">
                  {photo.url}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="p-3">
                  <div className="font-semibold text-sm text-dark-800 mb-1">{photo.caption}</div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {photo.date}</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full font-semibold">{photo.stage}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress by stage */}
          <h3 className="font-bold text-sm text-dark-800 mb-3">Fotos por etapa</h3>
          <div className="grid grid-cols-4 gap-3">
            {obra.stages.filter((s) => s.photos > 0).map((stage) => (
              <div key={stage.id} className="card p-4 text-center">
                <div className="text-2xl font-extrabold text-navy-500 mb-1">{stage.photos}</div>
                <div className="text-xs text-gray-500">{stage.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Contratistas ── */}
      {activeTab === "contratistas" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{obra.contractors.length} contratistas asignados a esta obra</p>
            <button className="flex items-center gap-2 bg-navy-500 hover:bg-navy-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
              <Plus className="w-4 h-4" /> Agregar contratista
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {obra.contractors.map((c) => {
              const csc = contractorStatusConfig(c.status);
              return (
                <div key={c.id} className="card p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-navy-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-dark-800">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.specialty}</div>
                      </div>
                    </div>
                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold", csc.color)}>
                      {csc.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-warning-500" /> {c.rating}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {c.phone}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {c.email}</span>
                  </div>

                  {c.activeStages.length > 0 && (
                    <div className="mb-3">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Etapas asignadas</div>
                      <div className="flex gap-1.5">
                        {c.activeStages.map((s) => (
                          <span key={s} className="bg-info-50 text-info-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                      <div className="text-xs font-extrabold text-dark-800">{formatCurrency(c.totalPaid)}</div>
                      <div className="text-[10px] text-gray-400">Total pagado</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                      <div className={cn("text-xs font-extrabold", c.pendingPayment > 0 ? "text-warning-500" : "text-success-500")}>
                        {formatCurrency(c.pendingPayment)}
                      </div>
                      <div className="text-[10px] text-gray-400">Pago pendiente</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                      <div className="text-xs font-extrabold text-dark-800 flex items-center justify-center gap-1">
                        <Shield className="w-3 h-3 text-success-500" /> {c.certExpiry}
                      </div>
                      <div className="text-[10px] text-gray-400">Venc. certificado</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-dark-800 font-semibold py-2 rounded-lg text-xs transition-colors">
                      Ver contrato
                    </button>
                    <button className="flex-1 bg-navy-500 hover:bg-navy-600 text-white font-semibold py-2 rounded-lg text-xs transition-colors">
                      Emitir certificado
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
