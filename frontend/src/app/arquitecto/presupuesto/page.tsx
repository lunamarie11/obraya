"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign, TrendingUp, AlertTriangle, CheckCircle,
  Plus, Trash2, Loader2, X,
} from "lucide-react";
import { cn, formatCurrency, getBudgetColor } from "@/lib/utils";
import { projectsApi, expensesApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

const EXPENSE_CATEGORIES = [
  "Materiales", "Mano de obra", "Equipos", "Transporte",
  "Honorarios", "Permisos", "Imprevistos", "Otros",
];

function NewExpenseModal({ projectId, onClose, onCreated }: {
  projectId: string; onClose: () => void; onCreated: () => void;
}) {
  const [form, setForm] = useState({
    concept: "", category: "Materiales",
    amount: "", date: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(f: string, v: string) { setForm((p) => ({ ...p, [f]: v })); }

  async function handleSave() {
    if (!form.concept.trim()) { setError("El concepto es obligatorio"); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setError("El monto debe ser mayor a cero"); return;
    }
    setSaving(true); setError(null);
    try {
      await expensesApi.create({
        projectId,
        concept: form.concept.trim(),
        category: form.category,
        amount: parseFloat(form.amount),
        date: form.date ? new Date(form.date) : undefined,
      });
      onCreated(); onClose();
    } catch (e: any) {
      setError(e.message || "Error al guardar");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-dark-800">Registrar gasto</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {error && <div className="bg-danger-50 text-danger-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Concepto *</label>
            <input value={form.concept} onChange={(e) => set("concept", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500"
              placeholder="Ej. Cemento Portland 50 bolsas" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Categoría</label>
              <select value={form.category} onChange={(e) => set("category", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500">
                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Monto (ARS) *</label>
              <input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500"
                placeholder="0" min="0" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Fecha</label>
            <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-navy-500 hover:bg-navy-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Registrar gasto
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PresupuestoPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [project, setProject] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    projectsApi.getAll(user?.id)
      .then((data) => {
        setProjects(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .catch(() => {})
      .finally(() => setProjectsLoading(false));
  }, []);

  const load = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const [proj, exps, summ] = await Promise.all([
        projectsApi.getOne(selectedId),
        expensesApi.getByProject(selectedId),
        expensesApi.getSummary(selectedId),
      ]);
      setProject(proj);
      setExpenses(exps);
      setSummary(summ);
    } catch {
      setProject(null); setExpenses([]); setSummary(null);
    } finally { setLoading(false); }
  }, [selectedId]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await expensesApi.remove(id);
      await load();
    } finally { setDeleting(null); }
  }

  const budget = project?.budget ?? 0;
  const spent = project?.spent ?? 0;
  const remaining = budget - spent;
  const spentPct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const overBudget = remaining < 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-dark-800">💰 Presupuesto</h1>
          <p className="text-sm text-gray-500 mt-1">Control de gastos por obra</p>
        </div>
        <div className="flex items-center gap-3">
          {projectsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : projects.length > 0 ? (
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-500 text-dark-800">
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          ) : (
            <span className="text-sm text-gray-400">Sin obras</span>
          )}
          <button onClick={() => setShowModal(true)} disabled={!selectedId}
            className="flex items-center gap-2 bg-navy-500 hover:bg-navy-600 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Registrar gasto
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-navy-500" />
        </div>
      ) : !project ? (
        <div className="text-center py-24 text-gray-400 text-sm">
          Seleccioná una obra para ver su presupuesto
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-5 mb-8">
            {[
              { label: "Presupuesto Total",     value: formatCurrency(budget),             icon: DollarSign,   color: "bg-navy-500",    sub: "100% asignado" },
              { label: "Gasto Ejecutado",        value: formatCurrency(spent),              icon: TrendingUp,   color: "bg-brand-500",   sub: `${spentPct}% del total` },
              { label: "Saldo Disponible",       value: formatCurrency(Math.abs(remaining)), icon: CheckCircle,  color: overBudget ? "bg-danger-500" : "bg-success-500", sub: overBudget ? "⚠ Presupuesto superado" : "Dentro del presupuesto" },
              { label: "Gastos registrados",     value: (summary?.count ?? 0).toString(),   icon: AlertTriangle, color: "bg-warning-500", sub: `${(summary?.byCategory ?? []).length} categorías` },
            ].map((kpi) => (
              <div key={kpi.label} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">{kpi.label}</p>
                    <p className="text-2xl font-extrabold mt-1">{kpi.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
                  </div>
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", kpi.color)}>
                    <kpi.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-6">
            {/* Category breakdown */}
            <div className="col-span-3 card">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-dark-800">Gasto por categoría</h2>
                <span className="text-xs text-gray-400">{formatCurrency(spent)} total ejecutado</span>
              </div>
              <div className="p-6 space-y-5">
                {!summary?.byCategory?.length ? (
                  <p className="text-sm text-gray-400 text-center py-6">Sin gastos registrados aún</p>
                ) : (
                  summary.byCategory
                    .sort((a: any, b: any) => b.amount - a.amount)
                    .map((cat: any) => {
                      const pct = spent > 0 ? Math.round((cat.amount / spent) * 100) : 0;
                      const pctOfBudget = budget > 0 ? Math.round((cat.amount / budget) * 100) : 0;
                      return (
                        <div key={cat.category}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm font-semibold text-dark-800">{cat.category}</span>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-gray-400">{formatCurrency(cat.amount)}</span>
                              <span className="font-bold text-gray-600">{pct}% del gasto</span>
                            </div>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", getBudgetColor(pctOfBudget))}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                )}

                {/* Budget progress */}
                {budget > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-semibold text-dark-800">Total vs. Presupuesto</span>
                      <span className={cn("text-xs font-bold", overBudget ? "text-danger-500" : "text-success-500")}>
                        {spentPct}%
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", getBudgetColor(spentPct))}
                        style={{ width: `${Math.min(spentPct, 100)}%` }}
                      />
                    </div>
                    {overBudget && (
                      <p className="text-[11px] text-danger-500 mt-1 font-medium">
                        ⚠ Sobrecosto: +{formatCurrency(Math.abs(remaining))}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Recent expenses */}
            <div className="col-span-2 card flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-dark-800">Últimos gastos</h2>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {expenses.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-12">Sin gastos registrados</p>
                ) : (
                  expenses.slice(0, 20).map((exp) => (
                    <div key={exp.id} className="px-5 py-3 flex items-start gap-3 group">
                      <div className="mt-0.5 w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-dark-800 truncate">{exp.concept}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-gray-400">
                            {new Date(exp.date).toLocaleDateString("es-AR")}
                          </span>
                          <span className="text-[11px] text-gray-300">·</span>
                          <span className="text-[11px] text-gray-400">{exp.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-dark-800">{formatCurrency(exp.amount)}</span>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          disabled={deleting === exp.id}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-300 hover:text-danger-500 transition-all"
                        >
                          {deleting === exp.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {showModal && selectedId && (
        <NewExpenseModal
          projectId={selectedId}
          onClose={() => setShowModal(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
