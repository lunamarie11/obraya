"use client";

import { useEffect, useState } from "react";
import { Building2, TrendingUp, DollarSign, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import ProgressBar from "@/components/ui/ProgressBar";
import { dashboardApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency, getProgressColor } from "@/lib/utils";
import Link from "next/link";

const PROJECT_STATUS_LABELS: Record<string, string> = {
  ON_TRACK: "En curso",
  AT_RISK: "En riesgo",
  DELAYED: "Demorado",
  COMPLETED: "Completado",
  PAUSED: "Pausado",
};

const PROJECT_STATUS_CLASSES: Record<string, string> = {
  ON_TRACK: "badge-info",
  AT_RISK: "badge-warning",
  DELAYED: "badge-danger",
  COMPLETED: "badge-success",
  PAUSED: "badge-default",
};

export default function ArquitectoDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { setError("Sesión no encontrada"); setLoading(false); return; }
    dashboardApi.getArquitectoStats(user.id)
      .then(setStats)
      .catch(() => setError("No se pudieron cargar las métricas"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 animate-spin text-navy-500" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <div className="bg-danger-50 text-danger-600 text-sm px-4 py-3 rounded-xl">{error ?? "Sin datos"}</div>
      </div>
    );
  }

  const budgetPct = stats.budget.percentage;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-dark-800">Dashboard de Obras</h1>
        <p className="text-sm text-gray-500 mt-1">Vista general de tus proyectos activos</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Obras Activas"
          value={stats.projects.active.toString()}
          change={`${stats.projects.total} en total`}
          changeType="up"
          icon={Building2}
          iconColor="bg-info-500"
        />
        <StatCard
          label="Avance Promedio"
          value={`${stats.avgProgress}%`}
          change={`${stats.tasks.done} tareas completadas`}
          changeType="up"
          icon={TrendingUp}
          iconColor="bg-success-500"
        />
        <StatCard
          label="Presupuesto Total"
          value={formatCurrency(stats.budget.total)}
          change={`${budgetPct}% ejecutado`}
          changeType={budgetPct > 90 ? "down" : "up"}
          icon={DollarSign}
          iconColor="bg-brand-500"
        />
        <StatCard
          label="En Riesgo"
          value={stats.projects.atRisk.toString()}
          change={`${stats.tasks.inProgress} tareas activas`}
          changeType={stats.projects.atRisk > 0 ? "down" : "up"}
          icon={AlertTriangle}
          iconColor="bg-danger-500"
        />
      </div>

      {/* Recent Projects Table */}
      <div className="card">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-base font-bold text-dark-800">Obras Recientes</h2>
          <Link href="/arquitecto/obras" className="text-sm text-brand-500 font-semibold hover:text-brand-600 flex items-center gap-1">
            Ver todas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {stats.recentProjects.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No hay proyectos aún.{" "}
            <Link href="/arquitecto/obras" className="text-brand-500 font-semibold">Crear primera obra →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {["Proyecto", "Avance", "Presupuesto", "Gastado", "Estado"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentProjects.map((p: any) => {
                  const pct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-sm text-dark-800">{p.name}</td>
                      <td className="px-6 py-4">
                        <div className="w-32">
                          <ProgressBar value={p.progress} color={getProgressColor(p.progress)} showLabel />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">{formatCurrency(p.budget)}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold">{formatCurrency(p.spent)}</div>
                        <div className={`text-xs font-semibold ${pct > 100 ? "text-danger-500" : "text-success-500"}`}>{pct}%</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${PROJECT_STATUS_CLASSES[p.status] ?? "badge-default"}`}>
                          {PROJECT_STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
