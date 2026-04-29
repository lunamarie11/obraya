"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2, Plus, MapPin, DollarSign, TrendingUp,
  Loader2, Pencil, Trash2, AlertTriangle, X,
} from "lucide-react";
import { cn, formatCurrency, getProgressColor } from "@/lib/utils";
import { projectsApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import ProgressBar from "@/components/ui/ProgressBar";

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  ON_TRACK:  { label: "En curso",   badge: "badge-info" },
  AT_RISK:   { label: "En riesgo",  badge: "badge-warning" },
  DELAYED:   { label: "Demorado",   badge: "badge-danger" },
  COMPLETED: { label: "Completado", badge: "badge-success" },
  PAUSED:    { label: "Pausado",    badge: "badge-default" },
};

const EMPTY_FORM = {
  name: "", address: "", description: "",
  budget: "", spent: "", progress: "0", status: "ON_TRACK",
};

function ProjectModal({ project, onClose, onSave }: {
  project: any | null; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState(
    project
      ? { name: project.name, address: project.address ?? "", description: project.description ?? "",
          budget: project.budget.toString(), spent: project.spent.toString(),
          progress: project.progress.toString(), status: project.status }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("El nombre es obligatorio"); return; }
    setSaving(true);
    setError(null);
    try {
      const user = getCurrentUser();
      const payload = {
        name: form.name.trim(),
        address: form.address.trim() || undefined,
        description: form.description.trim() || undefined,
        budget: parseFloat(form.budget) || 0,
        spent: parseFloat(form.spent) || 0,
        progress: parseInt(form.progress, 10) || 0,
        status: form.status,
        ownerId: user?.id,
      };
      if (project) {
        await projectsApi.update(project.id, payload);
      } else {
        await projectsApi.create(payload);
      }
      onSave();
      onClose();
    } catch (e: any) {
      setError(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-dark-800">{project ? "Editar obra" : "Nueva obra"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {error && <div className="text-danger-600 text-sm bg-danger-50 px-3 py-2 rounded-lg">{error}</div>}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Nombre *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500"
              placeholder="Ej. Edificio Palermo Green" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Dirección</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500"
              placeholder="Ej. Av. Santa Fe 4200, Palermo" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Presupuesto (ARS)</label>
              <input type="number" value={form.budget} onChange={(e) => set("budget", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500"
                placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Gastado (ARS)</label>
              <input type="number" value={form.spent} onChange={(e) => set("spent", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500"
                placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Avance (%)</label>
              <input type="number" min="0" max="100" value={form.progress} onChange={(e) => set("progress", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Estado</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500">
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Descripción</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500 resize-none"
              placeholder="Descripción del proyecto..." />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {project ? "Guardar cambios" : "Crear obra"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ObrasPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = getCurrentUser();
      const data = await projectsApi.getAll(user?.id);
      setProjects(data);
    } catch {
      setError("No se pudieron cargar las obras");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await projectsApi.remove(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const kpis = {
    active:    projects.filter((p) => ["ON_TRACK", "AT_RISK"].includes(p.status)).length,
    atRisk:    projects.filter((p) => p.status === "AT_RISK").length,
    budget:    projects.reduce((s, p) => s + (p.budget ?? 0), 0),
    spent:     projects.reduce((s, p) => s + (p.spent ?? 0), 0),
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-dark-800">🏗 Mis Obras</h1>
          <p className="text-sm text-gray-500 mt-1">Gestioná tus proyectos de construcción</p>
        </div>
        <button
          onClick={() => { setEditing(null); setModal("create"); }}
          className="flex items-center gap-2 bg-navy-500 hover:bg-navy-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Nueva obra
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { icon: Building2,    label: "Activas",            value: kpis.active,          color: "text-info-500",    bg: "bg-info-50" },
          { icon: AlertTriangle, label: "En riesgo",         value: kpis.atRisk,           color: "text-warning-500", bg: "bg-warning-50" },
          { icon: DollarSign,   label: "Presupuesto total",  value: formatCurrency(kpis.budget), color: "text-brand-500", bg: "bg-brand-50" },
          { icon: TrendingUp,   label: "Gastado",            value: formatCurrency(kpis.spent),  color: "text-success-500", bg: "bg-success-50" },
        ].map((k) => (
          <div key={k.label} className="card p-4 flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", k.bg)}>
              <k.icon className={cn("w-5 h-5", k.color)} />
            </div>
            <div>
              <div className="text-lg font-extrabold text-dark-800">{k.value}</div>
              <div className="text-[11px] text-gray-400">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 bg-danger-50 text-danger-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-navy-500" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-4">No tenés obras aún</p>
          <button
            onClick={() => { setEditing(null); setModal("create"); }}
            className="bg-navy-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-navy-600"
          >
            Crear primera obra
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {projects.map((p) => {
            const sc = STATUS_CONFIG[p.status] ?? { label: p.status, badge: "badge-default" };
            const budgetPct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
            return (
              <div key={p.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm text-dark-800 truncate">{p.name}</h3>
                      <span className={`badge ${sc.badge} shrink-0`}>{sc.label}</span>
                    </div>
                    {p.address && (
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" /> {p.address}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    <button
                      onClick={() => { setEditing(p); setModal("edit"); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-navy-500 hover:bg-navy-50 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deleting === p.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-danger-500 hover:bg-danger-50 transition-colors"
                    >
                      {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">Avance</span>
                    <span className="font-semibold text-dark-800">{p.progress}%</span>
                  </div>
                  <ProgressBar value={p.progress} color={getProgressColor(p.progress)} />
                </div>

                {/* Budget */}
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-400">Presupuesto: </span>
                    <span className="font-semibold text-dark-800">{formatCurrency(p.budget)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Gastado: </span>
                    <span className={cn("font-semibold", budgetPct > 90 ? "text-danger-500" : "text-success-500")}>
                      {formatCurrency(p.spent)} ({budgetPct}%)
                    </span>
                  </div>
                </div>

                {p.description && (
                  <p className="mt-3 text-xs text-gray-400 line-clamp-2">{p.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {(modal === "create" || modal === "edit") && (
        <ProjectModal
          project={modal === "edit" ? editing : null}
          onClose={() => { setModal(null); setEditing(null); }}
          onSave={load}
        />
      )}
    </div>
  );
}
