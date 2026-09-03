'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Building2, Search, CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';

const STATUSES = [
  { value: '', label: 'Todas' },
  { value: 'pending',   label: 'Pendientes' },
  { value: 'active',    label: 'Activas' },
  { value: 'suspended', label: 'Suspendidas' },
  { value: 'rejected',  label: 'Rechazadas' },
];

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
  active:    'bg-green-50 text-green-600 border border-green-200',
  suspended: 'bg-red-50 text-red-600 border border-red-200',
  rejected:  'bg-slate-100 text-slate-500 border border-slate-200',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', active: 'Activa', suspended: 'Suspendida', rejected: 'Rechazada',
};

export default function CompaniesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState<{id: string; status: string; name: string} | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteCompany = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/companies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setDeleteId(null);
    },
  });

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['admin-companies', statusFilter],
    queryFn: () =>
      api.get('/admin/companies', {
        params: { status: statusFilter || undefined },
      }).then((r) => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/admin/companies/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setConfirmAction(null);
    },
  });

  const filtered = companies.filter((c: any) =>
    !search ||
    c.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
    c.cuit.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 sticky top-0 z-10">
        <h1 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <Building2 size={16} className="text-slate-500" />
          Empresas
        </h1>
      </header>

      <div className="p-6 space-y-4">

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Buscar por empresa, CUIT o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                  statusFilter === s.value
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Cargando empresas...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No se encontraron empresas.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Empresa</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">CUIT</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Ubicación</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Usuarios</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs">Alta</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((company: any) => (
                  <tr key={company.id} className="hover:bg-orange-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/superadmin/companies/${company.id}`}
                        className="font-medium text-slate-900 hover:text-orange-500 transition-colors"
                      >
                        {company.razonSocial}
                      </Link>
                      <p className="text-xs text-slate-500">{company.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700 text-xs">{company.cuit}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {[company.city, company.province].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700 text-center">{company.usersCount}</td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                        STATUS_COLORS[company.status],
                      )}>
                        {STATUS_LABELS[company.status] ?? company.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {format(new Date(company.createdAt), "d MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {company.status === 'pending' && (
                          <button
                            onClick={() => setConfirmAction({ id: company.id, status: 'active', name: company.razonSocial })}
                            className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                            title="Aprobar"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        )}
                        {company.status === 'active' && (
                          <button
                            onClick={() => setConfirmAction({ id: company.id, status: 'suspended', name: company.razonSocial })}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                            title="Suspender"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                        {company.status === 'suspended' && (
                          <button
                            onClick={() => setConfirmAction({ id: company.id, status: 'active', name: company.razonSocial })}
                            className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                            title="Reactivar"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteId(company.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors"
                          title="Eliminar empresa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de confirmación */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-semibold text-slate-900 mb-2">
              {confirmAction.status === 'active' ? 'Aprobar empresa' : 'Suspender empresa'}
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              ¿Confirmás que querés{' '}
              <span className={confirmAction.status === 'active' ? 'text-green-600' : 'text-red-500'}>
                {confirmAction.status === 'active' ? 'aprobar' : 'suspender'}
              </span>{' '}
              a <span className="text-slate-900 font-medium">{confirmAction.name}</span>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => updateStatus.mutate({ id: confirmAction.id, status: confirmAction.status })}
                disabled={updateStatus.isPending}
                className={clsx(
                  'flex-1 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-60',
                  confirmAction.status === 'active'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600',
                )}
              >
                {updateStatus.isPending ? '...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-semibold text-slate-900 mb-2">Eliminar empresa</h3>
            <p className="text-sm text-slate-500 mb-5">
              Se eliminarán también todos sus usuarios. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium py-2 rounded-lg">Cancelar</button>
              <button onClick={() => deleteCompany.mutate(deleteId!)} disabled={deleteCompany.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-60">
                {deleteCompany.isPending ? '...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
