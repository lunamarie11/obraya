import {
  Building2,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import ProgressBar from "@/components/ui/ProgressBar";
import Avatar from "@/components/ui/Avatar";
import { projects } from "@/lib/mock-data";
import {
  formatCurrency,
  getStatusConfig,
  getProgressColor,
} from "@/lib/utils";

export default function DashboardPage() {
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const avgProgress = Math.round(
    projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
  );
  const alerts = projects.filter(
    (p) => p.status === "at_risk" || p.status === "delayed"
  ).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-dark-800">
          Dashboard de Obras
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Vista general de tus proyectos activos
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Obras Activas"
          value={projects.length.toString()}
          change="+3 este mes"
          changeType="up"
          icon={Building2}
          iconColor="bg-info-500"
        />
        <StatCard
          label="Avance Promedio"
          value={`${avgProgress}%`}
          change="+5% vs. mes anterior"
          changeType="up"
          icon={TrendingUp}
          iconColor="bg-success-500"
        />
        <StatCard
          label="Presupuesto Total"
          value={formatCurrency(totalBudget)}
          change={`${Math.round((totalSpent / totalBudget) * 100)}% ejecutado`}
          changeType="down"
          icon={DollarSign}
          iconColor="bg-brand-500"
        />
        <StatCard
          label="Alertas"
          value={alerts.toString()}
          change="2 sobrecosto, 1 retraso"
          changeType="down"
          icon={AlertTriangle}
          iconColor="bg-danger-500"
        />
      </div>

      {/* Projects Table */}
      <div className="card">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-base font-bold text-dark-800">Obras en Curso</h2>
          <button className="text-sm text-brand-500 font-semibold hover:text-brand-600 flex items-center gap-1">
            Ver todas <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">
                  Proyecto
                </th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">
                  Ubicacion
                </th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">
                  Avance
                </th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">
                  Presupuesto
                </th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">
                  Estado
                </th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">
                  Equipo
                </th>
                <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-6 py-3">
                  Fecha Fin
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {projects.map((project) => {
                const status = getStatusConfig(project.status);
                const budgetDiff = Math.round(
                  ((project.spent - project.budget) / project.budget) * 100
                );
                return (
                  <tr
                    key={project.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-sm text-dark-800">
                        {project.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {project.type} - {project.area}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {project.location}
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <ProgressBar
                          value={project.progress}
                          color={getProgressColor(project.progress)}
                          showLabel
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold">
                        {formatCurrency(project.budget)}
                      </div>
                      <div
                        className={`text-xs font-semibold ${budgetDiff > 0 ? "text-danger-500" : "text-success-500"}`}
                      >
                        {budgetDiff > 0 ? "+" : ""}
                        {budgetDiff}%
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex -space-x-2">
                        {project.team.slice(0, 3).map((member) => (
                          <Avatar
                            key={member.id}
                            initials={member.initials}
                            color={member.avatar_color}
                            size="sm"
                          />
                        ))}
                        {project.team.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500">
                            +{project.team.length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(project.end_date).toLocaleDateString("es-MX", {
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
