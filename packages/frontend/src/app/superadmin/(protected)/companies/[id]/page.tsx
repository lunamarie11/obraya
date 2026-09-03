'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, CheckCircle2, XCircle, Users, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  active:    'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  rejected:  'bg-slate-100 text-slate-500',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', active: 'Activa', suspended: 'Suspendida', rejected: 'Rechazada',
};

const ROLE_LABELS: Record<string, string> = {
  SuperAdmin: 'Super Admin', Admin: 'Admin', Vendedor: 'Vendedor',
  Logistica: 'Logística', Contabilidad: 'Contabilidad',
};

export default function CompanyDetailPage() {
  const params = useParams() as { id: string };
  const { id } = params;
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ['admin-company', id],
    queryFn: () => api.get(`/admin/companies/${id}`).then((r) => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.put(`/admin/companies/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-company', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">Cargando empresa...</div>
    );
  }

  if (!company) return null;

  return (
    <div>
      <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-6 sticky top-0 z-10">
        <Link href="/superadmin/companies" className="text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-base font-semibold text-slate-900">{company.razonSocial}</h1>
        <span className={clsx('ml-2 inline-flex px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[company.status])}>
          {STATUS_LABELS[company.status]}
        </span>
      </header>

      <div className="p-6 space-y-6">

        {/* Acciones */}
        {company.status !== 'active' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Aprobar empresa</p>
              <p className="text-xs text-slate-500 mt-0.5">
                La empresa podrá operar en la plataforma y recibir pedidos.
              </p>
            </div>
            <button
              onClick={() => updateStatus.mutate('active')}
              disabled={updateStatus.isPending}
              className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              <CheckCircle2 size={15} />
              Aprobar
            </button>
          </div>
        )}

        {company.status === 'active' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Suspender empresa</p>
              <p className="text-xs text-slate-500 mt-0.5">
                La empresa no podrá operar hasta ser reactivada.
              </p>
            </div>
            <button
              onClick={() => updateStatus.mutate('suspended')}
              disabled={updateStatus.isPending}
              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              <XCircle size={15} />
              Suspender
            </button>
          </div>
        )}

        {/* Info general */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Datos de la empresa</h2>
            <dl className="space-y-3">
              {[
                { label: 'Razón social', value: company.razonSocial },
                { label: 'CUIT', value: company.cuit },
                { label: 'Email', value: company.email },
                { label: 'Teléfono', value: company.phone || '—' },
                { label: 'Dirección', value: company.address || '—' },
                { label: 'Ciudad', value: [company.city, company.province].filter(Boolean).join(', ') || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="text-xs text-slate-900 font-medium text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Métricas</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users size={13} className="text-blue-600" />
                  <span className="text-xs text-slate-500">Usuarios</span>
                </div>
                <p className="text-xl font-bold text-slate-900">{company.users?.length ?? 0}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <ShoppingCart size={13} className="text-orange-500" />
                  <span className="text-xs text-slate-500">Pedidos</span>
                </div>
                <p className="text-xl font-bold text-slate-900">{company.orderCount ?? 0}</p>
              </div>
            </div>
            <dl className="space-y-3 mt-4">
              <div className="flex justify-between gap-4">
                <dt className="text-xs text-slate-500">Registrada</dt>
                <dd className="text-xs text-slate-900">
                  {format(new Date(company.createdAt), "d MMM yyyy", { locale: es })}
                </dd>
              </div>
              {company.approvedAt && (
                <div className="flex justify-between gap-4">
                  <dt className="text-xs text-slate-500">Aprobada</dt>
                  <dd className="text-xs text-slate-900">
                    {format(new Date(company.approvedAt), "d MMM yyyy", { locale: es })}
                    {company.approvedBy && <span className="text-slate-500"> por {company.approvedBy}</span>}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Usuarios */}
        {company.users?.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
                <Users size={13} />
                Usuarios ({company.users.length})
              </h2>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                {company.users.map((user: any) => (
                  <tr key={user.id} className="px-5 hover:bg-orange-50/50">
                    <td className="px-5 py-3">
                      <p className="text-slate-900 font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {user.isActive ? (
                        <span className="text-green-600">Activo</span>
                      ) : (
                        <span className="text-slate-500">Inactivo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
