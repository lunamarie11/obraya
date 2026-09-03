'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, formatARS } from '@/lib/api';
import {
  History, DollarSign, CheckCircle2, MapPin,
  ChevronRight, TrendingUp, Package, Search,
} from 'lucide-react';
import { format, startOfWeek, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';

const COMMISSION = 0.08;
const earn = (cents: number) => Math.round(Number(cents) * COMMISSION);

type Period = 'hoy' | 'semana' | 'mes' | 'todo';
const PERIOD_LABELS: Record<Period, string> = { hoy: 'Hoy', semana: 'Esta semana', mes: 'Este mes', todo: 'Todo' };

export default function DeliveryHistoryPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('semana');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['delivery-history'],
    queryFn: () => api.get('/orders', { params: { status: 'Entregado', limit: 200 } }).then(r => r.data),
  });

  const allOrders: any[] = data?.data ?? [];

  const now = new Date();
  const todayStr = now.toDateString();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const periodFiltered = allOrders.filter(o => {
    const d = o.actualDeliveryDate ? new Date(o.actualDeliveryDate) : new Date(o.updatedAt);
    if (period === 'hoy')    return d.toDateString() === todayStr;
    if (period === 'semana') return isAfter(d, weekStart);
    if (period === 'mes')    return isAfter(d, monthStart);
    return true;
  });

  const filtered = search
    ? periodFiltered.filter(o =>
        o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
        o.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
        o.deliveryAddress?.city?.toLowerCase().includes(search.toLowerCase()),
      )
    : periodFiltered;

  const totalEarnings = filtered.reduce((s, o) => s + earn(o.totalAmount), 0);
  const totalOrders = filtered.length;
  const avgEarning = totalOrders > 0 ? Math.round(totalEarnings / totalOrders) : 0;

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-5 sticky top-0 z-10 gap-3">
        <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center">
          <History size={16} className="text-slate-400" />
        </div>
        <span className="font-bold text-white">Historial</span>
      </header>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Entregas', value: totalOrders.toString(), icon: <CheckCircle2 size={15} className="text-green-400" />, bg: 'bg-green-500/10' },
            { label: 'Ganado', value: formatARS(totalEarnings), icon: <DollarSign size={15} className="text-orange-400" />, bg: 'bg-orange-500/10' },
            { label: 'Promedio', value: formatARS(avgEarning), icon: <TrendingUp size={15} className="text-purple-400" />, bg: 'bg-purple-500/10' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3">
              <div className={clsx('w-7 h-7 rounded-xl flex items-center justify-center mb-2', s.bg)}>{s.icon}</div>
              <p className="text-white font-bold text-sm leading-tight truncate">{s.value}</p>
              <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border shrink-0',
                period === p
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700',
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Buscar por pedido, cliente o ciudad..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <div key={i} className="h-24 bg-slate-800/50 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-10 text-center">
            <Package size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Sin entregas</p>
            <p className="text-slate-600 text-sm mt-1">
              {search ? 'No hay resultados.' : 'No hay entregas en este período.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((order: any) => {
              const deliveredAt = order.actualDeliveryDate
                ? new Date(order.actualDeliveryDate)
                : new Date(order.updatedAt);
              return (
                <button
                  key={order.id}
                  onClick={() => router.push(`/delivery/${order.id}`)}
                  className="w-full bg-slate-800/60 border border-slate-700/50 hover:border-orange-500/30 rounded-2xl p-4 text-left transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-500">{order.orderNumber}</span>
                        <span className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-semibold">
                          Entregado
                        </span>
                      </div>
                      <p className="text-white font-semibold text-sm truncate">{order.buyerName}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin size={11} className="text-slate-500 shrink-0" />
                        <p className="text-xs text-slate-500 truncate">
                          {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                        </p>
                      </div>
                    </div>
                    <div className="ml-3 text-right shrink-0">
                      <p className="text-green-400 font-extrabold text-base">+{formatARS(earn(order.totalAmount))}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {format(deliveredAt, "d MMM", { locale: es })}
                      </p>
                    </div>
                    <ChevronRight size={16} className="ml-2 text-slate-700 group-hover:text-slate-400 transition-colors shrink-0 mt-0.5" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
