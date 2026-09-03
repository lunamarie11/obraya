'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api, formatARS } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, Package, AlertTriangle, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

type Period = 'today' | 'week' | 'month';
const PERIOD_LABELS: Record<Period, string> = { today: 'Hoy', week: '7 días', month: 'Este mes' };

const STATUS_COLORS: Record<string, string> = {
  nuevo:      'bg-blue-50 text-blue-600 border-blue-200',
  aceptado:   'bg-indigo-50 text-indigo-600 border-indigo-200',
  preparacion:'bg-yellow-50 text-yellow-700 border-yellow-200',
  despachado: 'bg-purple-50 text-purple-600 border-purple-200',
  entregado:  'bg-green-50 text-green-600 border-green-200',
  cancelado:  'bg-red-50 text-red-600 border-red-200',
};

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => api.get(`/dashboard/summary?period=${period}`).then((r) => r.data),
  });

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* Period tabs */}
        <div className="flex gap-2">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-semibold transition-all btn-ios',
                period === p ? 'bg-orange-500 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50',
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isLoading
            ? [0, 1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-slate-200 animate-pulse" />)
            : (
              <>
                <KpiCard
                  label="Ingresos"
                  value={formatARS(data?.kpis?.totalRevenue ?? 0)}
                  change={data?.kpis?.revenueChangePct}
                  icon={<DollarSign size={18} />}
                  color="orange"
                />
                <KpiCard
                  label="Pedidos"
                  value={data?.kpis?.totalOrders ?? 0}
                  change={data?.kpis?.ordersChangePct}
                  icon={<ShoppingCart size={18} />}
                  color="blue"
                />
                <KpiCard
                  label="Ticket medio"
                  value={formatARS(data?.kpis?.avgTicket ?? 0)}
                  icon={<Package size={18} />}
                  color="purple"
                />
              </>
            )
          }
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Orders by status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">Pedidos por estado</h2>
              <Link href="/orders" className="text-xs text-slate-500 hover:text-orange-500 transition-colors flex items-center gap-1">
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {[0,1,2,3].map(i => <div key={i} className="h-8 bg-slate-200 rounded-xl animate-pulse" />)}
              </div>
            ) : data?.ordersByStatus ? (
              <div className="space-y-2">
                {Object.entries(data.ordersByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className={clsx(
                      'inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border capitalize',
                      STATUS_COLORS[status.toLowerCase()] ?? 'bg-slate-100 text-slate-600 border-slate-200',
                    )}>
                      {status}
                    </span>
                    <span className="font-bold text-slate-900">{count as number}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-slate-500 text-sm">Sin datos</p>}
          </div>

          {/* Top products */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900">Top productos</h2>
              <Link href="/products" className="text-xs text-slate-500 hover:text-orange-500 transition-colors flex items-center gap-1">
                Ver todos <ArrowRight size={12} />
              </Link>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[0,1,2,3,4].map(i => <div key={i} className="h-10 bg-slate-200 rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.topProducts ?? []).slice(0, 5).map((p: any, i: number) => (
                  <div key={p.productId} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center text-xs font-bold text-orange-600 shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.quantity} un.</p>
                    </div>
                    <span className="text-sm font-bold text-orange-500 shrink-0">{formatARS(p.revenue)}</span>
                  </div>
                ))}
                {!data?.topProducts?.length && <p className="text-slate-500 text-sm">Sin ventas en este período</p>}
              </div>
            )}
          </div>
        </div>

        {/* Low stock alert */}
        {(data?.alerts?.lowStockCount ?? 0) > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-700 text-sm">
                {data.alerts.lowStockCount} producto{data.alerts.lowStockCount > 1 ? 's' : ''} con bajo stock
              </p>
              <p className="text-xs text-amber-600 mt-1">Revisá el módulo de Stock para reponer.</p>
            </div>
            <Link href="/stock" className="shrink-0 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors">
              Ver stock →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label, value, change, icon, color,
}: {
  label: string;
  value: string | number;
  change?: number | null;
  icon: React.ReactNode;
  color: 'orange' | 'blue' | 'purple';
}) {
  const colors = {
    orange: 'bg-orange-50 text-orange-500 border-orange-200',
    blue:   'bg-blue-50 text-blue-500 border-blue-200',
    purple: 'bg-purple-50 text-purple-500 border-purple-200',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center border', colors[color])}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      {change != null && (
        <div className={clsx('flex items-center gap-1 mt-2 text-xs font-semibold', change >= 0 ? 'text-green-600' : 'text-red-500')}>
          {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{change >= 0 ? '+' : ''}{change}% vs anterior</span>
        </div>
      )}
    </div>
  );
}
