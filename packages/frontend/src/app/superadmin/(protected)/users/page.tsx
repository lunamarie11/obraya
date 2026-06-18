'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Search, Pencil, Trash2, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';

const ROLES = ['SuperAdmin', 'Admin', 'Vendedor', 'Logistica', 'Contabilidad'];
const ROLE_COLORS: Record<string, string> = {
  SuperAdmin: 'bg-orange-100 text-orange-700',
  Admin: 'bg-blue-100 text-blue-700',
  Vendedor: 'bg-green-100 text-green-700',
  Logistica: 'bg-purple-100 text-purple-700',
  Contabilidad: 'bg-yellow-100 text-yellow-700',
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () =>
      api.get('/admin/users', { params: { search: search || undefined } }).then((r) => r.data),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/admin/users/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingId(null);
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteId(null);
    },
  });

  return (
    <div>
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-6 sticky top-0 z-10">
        <h1 className="text-base font-semibold text-white">Usuarios</h1>
        <span className="ml-3 text-xs text-slate-500">{users.length} en total</span>
      </header>

      <div className="p-6 space-y-4">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Buscar por nombre, email o empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Cargando usuarios...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No se encontraron usuarios.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700">
                <tr>
                  {['Usuario', 'Email', 'Empresa', 'Rol', 'Estado', 'Último acceso', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-white font-medium whitespace-nowrap">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{u.email}</td>
                    <td className="px-4 py-3 text-slate-300 text-xs">{u.companyName}</td>
                    <td className="px-4 py-3">
                      {editingId === u.id ? (
                        <div className="flex items-center gap-1">
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            className="bg-slate-700 border border-slate-600 text-white text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          >
                            {ROLES.map((r) => <option key={r}>{r}</option>)}
                          </select>
                          <button
                            onClick={() => updateUser.mutate({ id: u.id, data: { role: editRole } })}
                            className="p-1 text-green-400 hover:text-green-300"
                          >
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-slate-500 hover:text-slate-300">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', ROLE_COLORS[u.role] ?? 'bg-slate-100 text-slate-600')}>
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => updateUser.mutate({ id: u.id, data: { isActive: !u.isActive } })}
                        className={clsx(
                          'inline-flex px-2 py-0.5 rounded-full text-xs font-medium transition-opacity hover:opacity-70',
                          u.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500',
                        )}
                      >
                        {u.isActive ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {u.lastLoginAt ? format(new Date(u.lastLoginAt), 'd MMM yyyy', { locale: es }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingId(u.id); setEditRole(u.role); }}
                          className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                          title="Editar rol"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteId(u.id)}
                          className="p-1.5 rounded bg-slate-700 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
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

      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-semibold text-white mb-2">Eliminar usuario</h3>
            <p className="text-sm text-slate-400 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium py-2 rounded-lg">
                Cancelar
              </button>
              <button
                onClick={() => deleteUser.mutate(deleteId!)}
                disabled={deleteUser.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-60"
              >
                {deleteUser.isPending ? '...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
