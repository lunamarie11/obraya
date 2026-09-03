"use client";

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Users, Database, Clock, Activity } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MonitoringPage() {
  const { data: stats, isLoading: sl } = useQuery({ queryKey: ['admin-stats'], queryFn: () => api.get('/admin/stats').then(r => r.data) });
  const { data: users } = useQuery({ queryKey: ['admin-users'], queryFn: () => api.get('/admin/users').then(r => r.data) });

  const { data: latency } = useQuery({
    queryKey: ['admin-latency'],
    queryFn: async () => {
      const t0 = Date.now();
      await api.get('/admin/stats');
      return Date.now() - t0;
    },
    refetchInterval: 15000,
  });

  const latencyColor = latency == null
    ? 'text-slate-500'
    : latency < 150 ? 'text-green-600' : latency < 500 ? 'text-yellow-700' : 'text-red-600';

  return (
    <div>
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 sticky top-0 z-10">
        <Activity size={16} className="text-orange-500 mr-2" />
        <h1 className="text-base font-semibold text-slate-900">Monitoreo</h1>
      </header>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard title="Usuarios totales" icon={<Users size={18} className="text-purple-600" />} bg="bg-purple-50">
            <span className="text-2xl font-extrabold text-slate-900">{sl ? '...' : stats?.totalUsers ?? 0}</span>
          </MetricCard>
          <MetricCard title="Empresas totales" icon={<Database size={18} className="text-blue-600" />} bg="bg-blue-50">
            <span className="text-2xl font-extrabold text-slate-900">{sl ? '...' : stats?.totalCompanies ?? 0}</span>
          </MetricCard>
          <MetricCard title="API latency" icon={<Clock size={18} className="text-green-600" />} bg="bg-green-50">
            <span className={`text-2xl font-extrabold ${latencyColor}`}>
              {latency != null ? `${latency} ms` : '—'}
            </span>
          </MetricCard>
        </div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users size={14} className="text-slate-500" />
              Todos los usuarios
              {users && <span className="text-slate-500 font-normal text-xs">— {users.length} en total</span>}
            </h2>
            <Link href="/superadmin/users" className="text-xs text-orange-500 hover:text-orange-600 transition-colors">
              Administrar →
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Nombre', 'Email', 'Empresa', 'Rol', 'Activo', 'Último acceso'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(users ?? []).slice(0, 50).map((u: any) => (
                  <tr key={u.id} className="hover:bg-orange-50/50 transition-colors">
                    <td className="px-4 py-3 text-slate-900 font-medium">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{u.email}</td>
                    <td className="px-4 py-3 text-slate-700 text-xs">{u.companyName ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{u.role}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        u.isActive
                          ? 'bg-green-50 text-green-600 border-green-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {u.isActive ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {u.lastLoginAt
                        ? format(new Date(u.lastLoginAt), "d MMM yyyy", { locale: es })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!users?.length && (
              <div className="p-8 text-center text-slate-500 text-sm">Sin usuarios registrados.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ title, icon, bg, children }: { title: string; icon: React.ReactNode; bg: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-500">{title}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>{icon}</div>
      </div>
      {children}
    </div>
  );
}
