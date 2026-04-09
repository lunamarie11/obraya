'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api, formatARS } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, Package, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

type Period = 'today' | 'week' | 'month';

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hoy',
  week: 'Últimos 7 días',
  month: 'Este mes',
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => api.get(`/dashboard/summary?period=${period}`).then((r) => r.data),
  });

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">

        {/* Selector de período */}
        <div className="flex gap-2">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                period === p ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50',
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* KPIs */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="card p-6 h-28 animate-pulse bg-slate-100" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              label="Ingresos"
              value={formatARS(data?.kpis?.totalRevenue ?? 0)}
              change={data?.kpis?.revenueChangePct}
              icon={<DollarSign size={20} className="text-orange-500" />}
            />
            <KpiCard
              label="Pedidos"
              value={data?.kpis?.totalOrders ?? 0}
              change={data?.kpis?.ordersChangePct}
              icon={<ShoppingCart size={20} className="text-blue-500" />}
            />
            <KpiCard
              label="Ticket medio"
              value={formatARS(data?.kpis?.avgTicket ?? 0)}
              icon={<Package size={20} className="text-purple-500" />}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pedidos por estado */}
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Pedidos por estado</h2>
            {data?.ordersByStatus && (
              <div className="space-y-2">
                {Object.entries(data.ordersByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`badge-${status}`}>{capitalize(status)}</span>
                    <span className="font-semibold text-slate-800">{count as number}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top productos */}
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Top 10 productos</h2>
            <div className="space-y-2">
              {data?.topProducts?.slice(0, 5).map((p: any, i: number) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.quantity} unidades</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{formatARS(p.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerta de bajo stock */}
        {(data?.alerts?.lowStockCount ?? 0) > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">
                {data.alerts.lowStockCount} producto{data.alerts.lowStockCount > 1 ? 's' : ''} con bajo stock
              </p>
              <p className="text-sm text-amber-600 mt-1">
                {data.alerts.lowStockProducts.map((s: any) => s.productId).join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, change, icon }: {
  label: string;
  value: string | number;
  change?: number | null;
  icon: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-500">{label}</span>
        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {change != null && (
        <div className={clsx('flex items-center gap-1 mt-2 text-sm', change >= 0 ? 'text-green-600' : 'text-red-500')}>
          {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{change >= 0 ? '+' : ''}{change}% vs período anterior</span>
        </div>
      )}
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
