'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { getStoredUser } from '@/lib/auth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';
import { UserPlus, Copy, CheckCheck, Building2, CreditCard, MapPin, Plus, X, Loader2 } from 'lucide-react';

const ROLES = [
  { value: 'Admin',        label: 'Admin',        desc: 'Acceso completo' },
  { value: 'Vendedor',     label: 'Vendedor',      desc: 'Productos y pedidos' },
  { value: 'Logistica',    label: 'Logística',     desc: 'Despacho y entregas' },
  { value: 'Contabilidad', label: 'Contabilidad',  desc: 'Reportes y facturación' },
];

const ROLE_COLORS: Record<string, string> = {
  Admin:        'bg-blue-100 text-blue-700',
  Vendedor:     'bg-green-100 text-green-700',
  Logistica:    'bg-purple-100 text-purple-700',
  Contabilidad: 'bg-yellow-100 text-yellow-700',
};

export default function SettingsPage() {
  const qc = useQueryClient();
  const [companyId, setCompanyId] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    email: '', firstName: '', lastName: '', role: 'Vendedor',
  });

  useEffect(() => {
    const user = getStoredUser();
    if (user) setCompanyId(user.companyId);
  }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['company-users', companyId],
    queryFn: () => api.get(`/companies/${companyId}/users`).then((r) => r.data),
    enabled: !!companyId,
  });

  const invite = useMutation({
    mutationFn: (data: typeof form) =>
      api.post(`/companies/${companyId}/users/invite`, data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['company-users', companyId] });
      setInviteToken(data.inviteToken ?? '');
      setForm({ email: '', firstName: '', lastName: '', role: 'Vendedor' });
    },
  });

  const copyToken = () => {
    const link = `${window.location.origin}/accept-invite?token=${inviteToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <Header title="Configuración" />
      <div className="p-6 max-w-3xl space-y-6">

        {/* Gestión de usuarios */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-700">Usuarios de la empresa</h2>
              <p className="text-xs text-slate-400 mt-0.5">Administrá quién tiene acceso al backoffice</p>
            </div>
            <button
              onClick={() => { setShowInvite(!showInvite); setInviteToken(''); }}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <UserPlus size={15} />
              Invitar usuario
            </button>
          </div>

          {/* Formulario de invitación */}
          {showInvite && (
            <div className="px-5 py-4 bg-orange-50 border-b border-orange-100">
              {inviteToken ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">
                    ¡Invitación creada! Compartí este enlace con el nuevo usuario:
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 truncate">
                      {`${typeof window !== 'undefined' ? window.location.origin : ''}/accept-invite?token=${inviteToken}`}
                    </div>
                    <button
                      onClick={copyToken}
                      className="btn-secondary text-sm flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {copied ? <CheckCheck size={14} className="text-green-500" /> : <Copy size={14} />}
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    El usuario usará este enlace para configurar su contraseña y acceder.
                  </p>
                  <button
                    onClick={() => { setShowInvite(false); setInviteToken(''); }}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Invitar otro usuario
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">Datos del nuevo usuario</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Nombre</label>
                      <input
                        className="input w-full text-sm"
                        placeholder="Juan"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Apellido</label>
                      <input
                        className="input w-full text-sm"
                        placeholder="García"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Email</label>
                    <input
                      className="input w-full text-sm"
                      type="email"
                      placeholder="juan@empresa.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Rol</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ROLES.map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setForm({ ...form, role: r.value })}
                          className={clsx(
                            'flex items-start gap-2 p-2.5 rounded-lg border text-left transition-colors',
                            form.role === r.value
                              ? 'border-orange-400 bg-orange-50'
                              : 'border-slate-200 bg-white hover:bg-slate-50',
                          )}
                        >
                          <div className={clsx(
                            'mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                            form.role === r.value ? 'border-orange-500 bg-orange-500' : 'border-slate-300',
                          )}>
                            {form.role === r.value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">{r.label}</p>
                            <p className="text-xs text-slate-400">{r.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowInvite(false)}
                      className="btn-secondary text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => invite.mutate(form)}
                      disabled={!form.email || !form.firstName || !form.lastName || invite.isPending}
                      className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60"
                    >
                      {invite.isPending ? 'Enviando...' : 'Crear invitación'}
                    </button>
                  </div>
                  {invite.isError && (
                    <p className="text-xs text-red-500">Error al crear la invitación. El email puede ya estar en uso.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Lista de usuarios */}
          {isLoading ? (
            <div className="p-6 text-center text-slate-400 text-sm">Cargando usuarios...</div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">No hay usuarios en esta empresa.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">Usuario</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Rol</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Último acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', ROLE_COLORS[u.role] ?? 'bg-slate-100 text-slate-500')}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                        u.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500',
                      )}>
                        {u.isActive ? 'Activo' : u.inviteToken ? 'Pendiente invitación' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {u.lastLoginAt
                        ? format(new Date(u.lastLoginAt), "d MMM yyyy 'a las' HH:mm", { locale: es })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Perfil de empresa */}
        <CompanyProfile companyId={companyId} />

      </div>
    </div>
  );
}

function CompanyProfile({ companyId }: { companyId: string }) {
  const qc = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => api.get(`/companies/${companyId}`).then((r) => r.data),
    enabled: !!companyId,
  });

  const [profile, setProfile] = useState({ phone: '', address: '', city: '', province: '' });
  const [banking, setBanking] = useState({ cbu: '', alias: '', bank: '', accountHolder: '' });
  const [zones, setZones] = useState<string[]>([]);
  const [newZone, setNewZone] = useState('');

  useEffect(() => {
    if (company) {
      setProfile({
        phone: company.phone ?? '',
        address: company.address ?? '',
        city: company.city ?? '',
        province: company.province ?? '',
      });
      setBanking({
        cbu: company.bankingData?.cbu ?? '',
        alias: company.bankingData?.alias ?? '',
        bank: company.bankingData?.bank ?? '',
        accountHolder: company.bankingData?.accountHolder ?? '',
      });
      setZones(company.coverageZones ?? []);
    }
  }, [company]);

  const update = useMutation({
    mutationFn: (data: any) => api.put(`/companies/${companyId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', companyId] }),
  });

  const handleSave = () => {
    update.mutate({
      ...profile,
      bankingData: banking,
      coverageZones: zones,
    });
  };

  const addZone = () => {
    const z = newZone.trim().replace(/\D/g, '').slice(0, 8);
    if (z && !zones.includes(z)) {
      setZones([...zones, z]);
      setNewZone('');
    }
  };

  if (isLoading || !company) return null;

  return (
    <div className="space-y-5">

      {/* Datos de la empresa */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-slate-400" />
          <h2 className="font-semibold text-slate-700">Datos de la empresa</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Razón social</label>
            <p className="text-sm font-medium text-slate-700">{company.razonSocial}</p>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">CUIT</label>
            <p className="text-sm font-mono text-slate-700">{company.cuit}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Teléfono</label>
            <input
              className="input w-full text-sm"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+54 11 1234-5678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Provincia</label>
            <input
              className="input w-full text-sm"
              value={profile.province}
              onChange={(e) => setProfile({ ...profile, province: e.target.value })}
              placeholder="Buenos Aires"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Ciudad</label>
            <input
              className="input w-full text-sm"
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              placeholder="CABA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Dirección</label>
            <input
              className="input w-full text-sm"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              placeholder="Av. Corrientes 1234"
            />
          </div>
        </div>
      </div>

      {/* Datos bancarios */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-slate-400" />
          <h2 className="font-semibold text-slate-700">Datos bancarios</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">CBU</label>
            <input
              className="input w-full text-sm font-mono"
              value={banking.cbu}
              onChange={(e) => setBanking({ ...banking, cbu: e.target.value })}
              placeholder="0000000000000000000000"
              maxLength={22}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Alias</label>
            <input
              className="input w-full text-sm"
              value={banking.alias}
              onChange={(e) => setBanking({ ...banking, alias: e.target.value })}
              placeholder="empresa.banco.alias"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Banco</label>
            <input
              className="input w-full text-sm"
              value={banking.bank}
              onChange={(e) => setBanking({ ...banking, bank: e.target.value })}
              placeholder="Banco Nación"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Titular de la cuenta</label>
            <input
              className="input w-full text-sm"
              value={banking.accountHolder}
              onChange={(e) => setBanking({ ...banking, accountHolder: e.target.value })}
              placeholder="Empresa S.A."
            />
          </div>
        </div>
      </div>

      {/* Zonas de cobertura */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-slate-400" />
          <h2 className="font-semibold text-slate-700">Zonas de cobertura</h2>
        </div>
        <p className="text-xs text-slate-400">Agregá los códigos postales donde hacen entregas.</p>

        <div className="flex gap-2">
          <input
            className="input flex-1 text-sm"
            placeholder="Ej: 1424"
            value={newZone}
            onChange={(e) => setNewZone(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addZone(); } }}
          />
          <button type="button" onClick={addZone} className="btn-secondary text-sm flex items-center gap-1.5">
            <Plus size={14} /> Agregar
          </button>
        </div>

        {zones.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {zones.map((z) => (
              <span key={z} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-mono px-2.5 py-1 rounded-full">
                {z}
                <button type="button" onClick={() => setZones(zones.filter((x) => x !== z))} className="text-slate-400 hover:text-red-500 ml-0.5">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        {zones.length === 0 && (
          <p className="text-xs text-slate-400 italic">Sin zonas de cobertura configuradas.</p>
        )}
      </div>

      {/* Guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={update.isPending}
          className="btn-primary flex items-center gap-2 disabled:opacity-60"
        >
          {update.isPending && <Loader2 size={15} className="animate-spin" />}
          {update.isPending ? 'Guardando...' : update.isSuccess ? '¡Guardado!' : 'Guardar configuración'}
        </button>
      </div>

    </div>
  );
}
