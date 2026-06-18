"use client";

import { useQuery } from '@tanstack/react-query';
import { api, formatARS } from '@/lib/api';
import { Users, Database, Clock } from 'lucide-react';
import Link from 'next/link';

export default function MonitoringPage() {
  const { data: stats, isLoading: sl } = useQuery({ queryKey: ['admin-stats'], queryFn: () => api.get('/admin/stats').then(r => r.data) });
  const { data: users } = useQuery({ queryKey: ['admin-users'], queryFn: () => api.get('/admin/users').then(r => r.data) });

  // simple latency measurement: request admin stats and measure ms
  const { data: latency } = useQuery({
    queryKey: ['admin-latency'],
    queryFn: async () => {
      const t0 = Date.now();
      await api.get('/admin/stats');
      return Date.now() - t0;
    },
    refetchInterval: 15000,
  });

  return (
    <div>
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-6 sticky top-0 z-10">
        <h1 className="text-base font-semibold text-white">Monitoring</h1>
      </header>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Usuarios" icon={<Users size={18} />}>
            {sl ? '...' : stats?.totalUsers ?? 0}
          </Card>
          <Card title="Empresas" icon={<Database size={18} />}>
            {sl ? '...' : stats?.totalCompanies ?? 0}
          </Card>
          <Card title="API latency" icon={<Clock size={18} />}>
            {latency != null ? `${latency} ms` : 'calculando...'}
          </Card>
        </div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Usuarios</h2>
            <Link href="/superadmin/users" className="text-xs text-orange-500 hover:underline">Administrar usuarios</Link>
          </div>

          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100"><tr>{['Nombre','Email','Empresa','Rol','Activo','Último acceso'].map(h => <th key={h} className="text-left px-4 py-2 text-xs text-slate-600">{h}</th>)}</tr></thead>
              <tbody>
                {(users ?? []).slice(0,50).map((u:any) => (
                  <tr key={u.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-2">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-2 text-slate-600 text-xs">{u.email}</td>
                    <td className="px-4 py-2 text-slate-600 text-xs">{u.companyName}</td>
                    <td className="px-4 py-2 text-slate-600 text-xs">{u.role}</td>
                    <td className="px-4 py-2 text-slate-600 text-xs">{u.isActive ? 'Sí' : 'No'}</td>
                    <td className="px-4 py-2 text-slate-600 text-xs">{u.lastLoginAt ?? '—'}</td>
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

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-500">{title}</span>
        <div className="text-slate-400">{icon}</div>
      </div>
      <div className="text-2xl font-bold">{children}</div>
    </div>
  );
}
