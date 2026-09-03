'use client';

import { useQuery } from '@tanstack/react-query';
import { api, formatARS } from '@/lib/api';
import { Building2, Users, ShoppingCart, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';

const CO_COLORS: Record<string, string> = { pending: 'bg-yellow-50 text-yellow-700 border-yellow-200', active: 'bg-green-50 text-green-600 border-green-200', suspended: 'bg-red-50 text-red-600 border-red-200', rejected: 'bg-slate-100 text-slate-500 border-slate-200' };
const CO_LABELS: Record<string, string> = { pending: 'Pendiente', active: 'Activa', suspended: 'Suspendida', rejected: 'Rechazada' };
const OR_BADGE: Record<string, string> = { Nuevo: 'bg-blue-50 text-blue-600 border-blue-200', Aceptado: 'bg-indigo-50 text-indigo-600 border-indigo-200', Preparacion: 'bg-yellow-50 text-yellow-700 border-yellow-200', Despachado: 'bg-purple-50 text-purple-600 border-purple-200', Entregado: 'bg-green-50 text-green-600 border-green-200', Cancelado: 'bg-red-50 text-red-600 border-red-200' };

export default function SuperAdminDashboard() {
  const { data: stats, isLoading: sl } = useQuery({ queryKey: ['admin-stats'], queryFn: () => api.get('/admin/stats').then(r => r.data) });
  const { data: companies } = useQuery({ queryKey: ['admin-companies'], queryFn: () => api.get('/admin/companies').then(r => r.data) });
  const { data: recentOrders } = useQuery({ queryKey: ['admin-orders-recent'], queryFn: () => api.get('/admin/orders', { params: { limit: 8 } }).then(r => r.data) });

  const pending = (companies ?? []).filter((c: any) => c.status === 'pending');

  const kpis = [
    { label: 'Ingresos totales',      val: formatARS(stats?.totalRevenue ?? 0),  icon: <DollarSign size={18} className="text-green-600" />,  bg: 'bg-green-50' },
    { label: 'Pedidos totales',       val: stats?.totalOrders ?? 0,              icon: <ShoppingCart size={18} className="text-orange-500" />, bg: 'bg-orange-50' },
    { label: 'Empresas activas',      val: stats?.activeCompanies ?? 0,          icon: <CheckCircle2 size={18} className="text-blue-600" />,   bg: 'bg-blue-50' },
    { label: 'Usuarios activos',      val: stats?.totalUsers ?? 0,               icon: <Users size={18} className="text-purple-600" />,        bg: 'bg-purple-50' },
    { label: 'Empresas totales',      val: stats?.totalCompanies ?? 0,           icon: <Building2 size={18} className="text-slate-500" />,     bg: 'bg-slate-100' },
    { label: 'Pendientes aprobación', val: stats?.pendingCompanies ?? 0,         icon: <Clock size={18} className="text-yellow-700" />,        bg: 'bg-yellow-50' },
  ];

  return (
    <div>
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 sticky top-0 z-10">
        <h1 className="text-base font-semibold text-slate-900">Panel de plataforma</h1>
      </header>
      <div className="p-6 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map(k => (
            <div key={k.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500">{k.label}</span>
                <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', k.bg)}>{k.icon}</div>
              </div>
              {sl ? <div className="h-7 w-16 bg-slate-200 rounded animate-pulse" /> : <p className="text-2xl font-bold text-slate-900">{k.val}</p>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pendientes */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Clock size={14} className="text-yellow-600" /> Pendientes de aprobación
                {pending.length > 0 && <span className="bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded-full">{pending.length}</span>}
              </h2>
              <Link href="/superadmin/companies?status=pending" className="text-xs text-orange-500 hover:text-orange-600">Ver todas</Link>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {pending.length === 0
                ? <div className="p-6 text-center text-slate-500 text-sm">No hay empresas pendientes.</div>
                : <table className="w-full text-sm"><tbody className="divide-y divide-slate-100">{pending.slice(0,5).map((c: any) => (
                    <tr key={c.id} className="hover:bg-orange-50/50">
                      <td className="px-4 py-3"><p className="text-slate-900 font-medium text-sm">{c.razonSocial}</p><p className="text-xs text-slate-500">{format(new Date(c.createdAt),'d MMM yyyy',{locale:es})}</p></td>
                      <td className="px-4 py-3 text-right"><Link href={`/superadmin/companies/${c.id}`} className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-medium">Revisar</Link></td>
                    </tr>
                  ))}</tbody></table>
              }
            </div>
          </section>

          {/* Pedidos recientes */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><ShoppingCart size={14} className="text-slate-500" /> Pedidos recientes</h2>
              <Link href="/superadmin/orders" className="text-xs text-orange-500 hover:text-orange-600">Ver todos</Link>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {!recentOrders?.data?.length
                ? <div className="p-6 text-center text-slate-500 text-sm">Sin pedidos aún.</div>
                : <table className="w-full text-sm"><tbody className="divide-y divide-slate-100">{recentOrders.data.map((o: any) => (
                    <tr key={o.id} className="hover:bg-orange-50/50">
                      <td className="px-4 py-3"><p className="text-slate-900 font-mono text-xs font-medium">{o.orderNumber}</p><p className="text-xs text-slate-500">{o.companyName}</p></td>
                      <td className="px-4 py-3"><span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border', OR_BADGE[o.status] ?? 'bg-slate-100 text-slate-500 border-slate-200')}>{o.status}</span></td>
                      <td className="px-4 py-3 text-right text-xs text-slate-900 font-medium">{formatARS(Number(o.totalAmount))}</td>
                    </tr>
                  ))}</tbody></table>
              }
            </div>
          </section>
        </div>

        {/* Todas las empresas */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Building2 size={14} className="text-slate-500" /> Empresas registradas</h2>
            <Link href="/superadmin/companies" className="text-xs text-orange-500 hover:text-orange-600">Ver todas</Link>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>{['Empresa','CUIT','Usuarios','Estado','Alta'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(companies ?? []).slice(0,8).map((c: any) => (
                  <tr key={c.id} className="hover:bg-orange-50/50">
                    <td className="px-4 py-3"><Link href={`/superadmin/companies/${c.id}`} className="text-slate-900 hover:text-orange-500 font-medium text-sm">{c.razonSocial}</Link></td>
                    <td className="px-4 py-3 font-mono text-slate-500 text-xs">{c.cuit}</td>
                    <td className="px-4 py-3 text-slate-700 text-center">{c.usersCount}</td>
                    <td className="px-4 py-3"><span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border', CO_COLORS[c.status])}>{CO_LABELS[c.status]}</span></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{format(new Date(c.createdAt),'d MMM yyyy',{locale:es})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
