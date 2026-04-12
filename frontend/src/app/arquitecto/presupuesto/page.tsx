"use client";

import { DollarSign, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { budgetCategories, recentExpenses } from "@/lib/mock-data";
import { formatCurrency, formatDate, getBudgetColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function PresupuestoPage() {
  const totalBudgeted = budgetCategories.reduce((s, c) => s + c.budgeted, 0);
  const totalSpent = budgetCategories.reduce((s, c) => s + c.spent, 0);
  const remaining = totalBudgeted - totalSpent;
  const overBudget = budgetCategories.filter((c) => c.spent > c.budgeted).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-dark-800">Presupuesto</h1>
        <p className="text-sm text-gray-500 mt-1">Casa Familia Lopez — Abril 2026</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {[
          { label: "Presupuesto Total", value: formatCurrency(totalBudgeted), icon: DollarSign, color: "bg-navy-500", change: "100% asignado" },
          { label: "Gasto Ejecutado", value: formatCurrency(totalSpent), icon: TrendingUp, color: "bg-brand-500", change: `${Math.round((totalSpent / totalBudgeted) * 100)}% del total` },
          { label: "Saldo Disponible", value: formatCurrency(Math.max(remaining, 0)), icon: CheckCircle, color: "bg-success-500", change: remaining >= 0 ? "Dentro del presupuesto" : "Sobrepasado" },
          { label: "Categorías con Alerta", value: overBudget.toString(), icon: AlertTriangle, color: "bg-danger-500", change: "Sobrecosto detectado" },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{kpi.label}</p>
                <p className="text-2xl font-extrabold mt-1">{kpi.value}</p>
                <p className="text-xs text-gray-400 mt-1">{kpi.change}</p>
              </div>
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", kpi.color)}>
                <kpi.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Categories */}
        <div className="col-span-3 card">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-dark-800">Desglose por Categoría</h2>
          </div>
          <div className="p-6 space-y-5">
            {budgetCategories.map((cat) => {
              const pct = Math.round((cat.spent / cat.budgeted) * 100);
              const isOver = cat.spent > cat.budgeted;
              return (
                <div key={cat.id}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold text-dark-800">{cat.name}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-400">
                        {formatCurrency(cat.spent)} / {formatCurrency(cat.budgeted)}
                      </span>
                      <span
                        className={cn(
                          "font-bold",
                          isOver ? "text-danger-500" : "text-success-500"
                        )}
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        getBudgetColor(pct)
                      )}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  {isOver && (
                    <p className="text-[11px] text-danger-500 mt-1 font-medium">
                      ⚠ Sobrecosto: +{formatCurrency(cat.spent - cat.budgeted)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="col-span-2 card">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-dark-800">Últimos Gastos</h2>
            <button className="text-sm text-navy-500 font-semibold hover:underline">Ver todos</button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentExpenses.map((exp) => (
              <div key={exp.id} className="px-6 py-3.5 flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-dark-800 truncate">{exp.concept}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-gray-400">{formatDate(exp.date)}</span>
                    <span className="text-[11px] text-gray-300">·</span>
                    <span className="text-[11px] text-gray-400">{exp.category}</span>
                  </div>
                </div>
                <div className="text-sm font-bold text-dark-800 shrink-0">
                  {formatCurrency(exp.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
