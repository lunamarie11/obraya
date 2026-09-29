'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { api, formatARS } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { getStoredUser } from '@/lib/auth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';
import { UserPlus, Copy, CheckCheck, Building2, CreditCard, MapPin, Plus, X, Loader2, Trash2 } from 'lucide-react';
import type { DeliveryZone, FleetType } from '@obraya/shared';

const FLEET_TYPES: { value: FleetType; label: string }[] = [
  { value: 'propia', label: 'Flota propia' },
  { value: 'tercerizada', label: 'Tercerizada' },
  { value: 'retiro_local', label: 'Retiro local' },
];

const ROLES = [
  { value: 'Admin',        label: 'Admin',        desc: 'Acceso completo' },
  { value: 'Vendedor',     label: 'Vendedor',      desc: 'Productos y pedidos' },
  { value: 'Logistica',    label: 'Logística',     desc: 'Despacho y entregas' },
  { value: 'Contabilidad', label: 'Contabilidad',  desc: 'Reportes y facturación' },
];

const ROLE_COLORS: Record<string, string> = {
  Admin:        'bg-blue-50 text-blue-600 border-blue-200',
  Vendedor:     'bg-green-50 text-green-600 border-green-200',
  Logistica:    'bg-purple-50 text-purple-600 border-purple-200',
  Contabilidad: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

export default function SettingsPage() {
  const qc = useQueryClient();
  const [companyId, setCompanyId] = useState('');
  const [role, setRole] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    email: '', firstName: '', lastName: '', role: 'Vendedor',
  });

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCompanyId(user.companyId);
      setRole(user.role ?? '');
    }
  }, []);

  const isAdmin = role === 'Admin';

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['company-users', companyId],
    queryFn: () => api.get(`/companies/${companyId}/users`).then((r) => r.data),
    enabled: !!companyId && isAdmin,
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

        {/* Usuarios (solo Admin: invitar y ver usuarios es Admin-only en el backend) */}
        {isAdmin && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Usuarios de la empresa</h2>
              <p className="text-xs text-slate-500 mt-0.5">Administrá quién tiene acceso al backoffice</p>
            </div>
            <button
              onClick={() => { setShowInvite(!showInvite); setInviteToken(''); }}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <UserPlus size={15} />
              Invitar usuario
            </button>
          </div>

          {showInvite && (
            <div className="px-5 py-4 bg-orange-50 border-b border-orange-200">
              {inviteToken ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-900">
                    ¡Invitación creada! Compartí este enlace con el nuevo usuario:
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 truncate">
                      {`${typeof window !== 'undefined' ? window.location.origin : ''}/accept-invite?token=${inviteToken}`}
                    </div>
                    <button
                      onClick={copyToken}
                      className="btn-secondary text-sm flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {copied ? <CheckCheck size={14} className="text-green-600" /> : <Copy size={14} />}
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    El usuario usará este enlace para configurar su contraseña y acceder.
                  </p>
                  <button
                    onClick={() => { setShowInvite(false); setInviteToken(''); }}
                    className="text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors"
                  >
                    Invitar otro usuario
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-900">Datos del nuevo usuario</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Nombre</label>
                      <input className="input w-full text-sm" placeholder="Juan" value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Apellido</label>
                      <input className="input w-full text-sm" placeholder="García" value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Email</label>
                    <input className="input w-full text-sm" type="email" placeholder="juan@empresa.com" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Rol</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ROLES.map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setForm({ ...form, role: r.value })}
                          className={clsx(
                            'flex items-start gap-2 p-2.5 rounded-xl border text-left transition-colors',
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
                            <p className="text-sm font-semibold text-slate-900">{r.label}</p>
                            <p className="text-xs text-slate-500">{r.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setShowInvite(false)} className="btn-secondary text-sm">
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

          {isLoading ? (
            <div className="p-6 text-center text-slate-500 text-sm">Cargando usuarios...</div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No hay usuarios en esta empresa.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Usuario</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Rol</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Último acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-orange-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-900">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border', ROLE_COLORS[u.role] ?? 'bg-slate-100 text-slate-600 border-slate-200')}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border',
                        u.isActive
                          ? 'bg-green-50 text-green-600 border-green-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200',
                      )}>
                        {u.isActive ? 'Activo' : u.inviteToken ? 'Pendiente' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
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
        )}

        <CompanyProfile companyId={companyId} role={role} />
      </div>
    </div>
  );
}

function CompanyProfile({ companyId, role }: { companyId: string; role: string }) {
  const qc = useQueryClient();
  // Datos bancarios/perfil son Admin-only en el backend (PUT /companies/:id).
  // Zonas de entrega las puede configurar Admin o Logistica (PUT
  // /companies/:id/delivery-zones), ver ADR-016.
  const canEditProfile = role === 'Admin';
  const canEditZones = role === 'Admin' || role === 'Logistica';

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => api.get(`/companies/${companyId}`).then((r) => r.data),
    enabled: !!companyId,
  });

  const [profile, setProfile] = useState({ phone: '', address: '', city: '', province: '' });
  const [banking, setBanking] = useState({ cbu: '', alias: '', bank: '', accountHolder: '' });
  const [zones, setZones] = useState<DeliveryZone[]>([]);

  useEffect(() => {
    if (company) {
      setProfile({ phone: company.phone ?? '', address: company.address ?? '', city: company.city ?? '', province: company.province ?? '' });
      setBanking({ cbu: company.bankingData?.cbu ?? '', alias: company.bankingData?.alias ?? '', bank: company.bankingData?.bank ?? '', accountHolder: company.bankingData?.accountHolder ?? '' });
      setZones(company.deliveryZones ?? []);
    }
  }, [company]);

  const updateProfile = useMutation({
    mutationFn: (data: any) => api.put(`/companies/${companyId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', companyId] }),
  });

  const updateZones = useMutation({
    mutationFn: (deliveryZones: DeliveryZone[]) => api.put(`/companies/${companyId}/delivery-zones`, { deliveryZones }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', companyId] }),
  });

  const handleSaveProfile = () => {
    updateProfile.mutate({ ...profile, bankingData: banking });
  };

  const handleSaveZones = () => {
    updateZones.mutate(zones);
  };

  const addZone = () => {
    setZones([...zones, {
      id: `zone-${Date.now()}`,
      name: '',
      zipCodes: [],
      promisedHours: 24,
      fleetType: 'propia',
      shippingCost: 0,
    }]);
  };

  const updateZone = (id: string, patch: Partial<DeliveryZone>) => {
    setZones(zones.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  };

  const removeZone = (id: string) => setZones(zones.filter((z) => z.id !== id));

  if (isLoading || !company) return null;

  return (
    <div className="space-y-5">

      {canEditProfile && (
      <>
      {/* Datos empresa */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-slate-500" />
          <h2 className="font-bold text-slate-900">Datos de la empresa</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Razón social</label>
            <p className="text-sm font-semibold text-slate-900">{company.razonSocial}</p>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">CUIT</label>
            <p className="text-sm font-mono text-slate-700">{company.cuit}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Teléfono</label>
            <input className="input w-full text-sm" value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+54 11 1234-5678" />
          </div>
          <div>
            <label className="label">Provincia</label>
            <input className="input w-full text-sm" value={profile.province}
              onChange={(e) => setProfile({ ...profile, province: e.target.value })} placeholder="Buenos Aires" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Ciudad</label>
            <input className="input w-full text-sm" value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })} placeholder="CABA" />
          </div>
          <div>
            <label className="label">Dirección</label>
            <input className="input w-full text-sm" value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Av. Corrientes 1234" />
          </div>
        </div>
      </div>

      {/* Datos bancarios */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-slate-500" />
          <h2 className="font-bold text-slate-900">Datos bancarios</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">CBU</label>
            <input className="input w-full text-sm font-mono" value={banking.cbu}
              onChange={(e) => setBanking({ ...banking, cbu: e.target.value })} placeholder="0000000000000000000000" maxLength={22} />
          </div>
          <div>
            <label className="label">Alias</label>
            <input className="input w-full text-sm" value={banking.alias}
              onChange={(e) => setBanking({ ...banking, alias: e.target.value })} placeholder="empresa.banco.alias" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Banco</label>
            <input className="input w-full text-sm" value={banking.bank}
              onChange={(e) => setBanking({ ...banking, bank: e.target.value })} placeholder="Banco Nación" />
          </div>
          <div>
            <label className="label">Titular de la cuenta</label>
            <input className="input w-full text-sm" value={banking.accountHolder}
              onChange={(e) => setBanking({ ...banking, accountHolder: e.target.value })} placeholder="Empresa S.A." />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSaveProfile} disabled={updateProfile.isPending} className="btn-primary flex items-center gap-2 disabled:opacity-60">
          {updateProfile.isPending && <Loader2 size={15} className="animate-spin" />}
          {updateProfile.isPending ? 'Guardando...' : updateProfile.isSuccess ? '¡Guardado!' : 'Guardar datos de empresa'}
        </button>
      </div>
      </>
      )}

      {/* Zonas de entrega (Admin o Logistica) */}
      {canEditZones && (
      <>
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-slate-500" />
            <h2 className="font-bold text-slate-900">Zonas de entrega</h2>
          </div>
          <button type="button" onClick={addZone} className="btn-secondary text-sm flex items-center gap-1.5">
            <Plus size={14} /> Nueva zona
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Definí zonas por código postal con su costo de envío y tiempo estimado. Se usan para cotizar el envío en el checkout del comprador.
        </p>

        {zones.length === 0 && (
          <p className="text-xs text-slate-500 italic">Sin zonas de entrega configuradas.</p>
        )}

        <div className="space-y-3">
          {zones.map((zone) => (
            <ZoneEditor key={zone.id} zone={zone} onChange={(patch) => updateZone(zone.id, patch)} onRemove={() => removeZone(zone.id)} />
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSaveZones} disabled={updateZones.isPending} className="btn-primary flex items-center gap-2 disabled:opacity-60">
          {updateZones.isPending && <Loader2 size={15} className="animate-spin" />}
          {updateZones.isPending ? 'Guardando...' : updateZones.isSuccess ? '¡Guardado!' : 'Guardar zonas de entrega'}
        </button>
      </div>
      </>
      )}
    </div>
  );
}

function ZoneEditor({
  zone,
  onChange,
  onRemove,
}: {
  zone: DeliveryZone;
  onChange: (patch: Partial<DeliveryZone>) => void;
  onRemove: () => void;
}) {
  const [newZip, setNewZip] = useState('');
  const [costInput, setCostInput] = useState(String(zone.shippingCost / 100));

  const addZip = () => {
    const z = newZip.trim().replace(/\D/g, '').slice(0, 8);
    if (z && !zone.zipCodes.includes(z)) onChange({ zipCodes: [...zone.zipCodes, z] });
    setNewZip('');
  };

  return (
    <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
      <div className="flex items-start justify-between gap-2">
        <input
          className="input flex-1 text-sm font-semibold"
          placeholder="Nombre de la zona (ej: CABA)"
          value={zone.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors p-2" title="Eliminar zona">
          <Trash2 size={15} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Flota</label>
          <select
            className="input w-full text-sm"
            value={zone.fleetType}
            onChange={(e) => onChange({ fleetType: e.target.value as FleetType })}
          >
            {FLEET_TYPES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tiempo estimado (hs)</label>
          <input
            type="number" min={1} className="input w-full text-sm"
            value={zone.promisedHours}
            onChange={(e) => onChange({ promisedHours: Number(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="label">Costo de envío ($)</label>
          <input
            type="number" min="0" step="0.01" className="input w-full text-sm"
            value={costInput}
            onChange={(e) => {
              setCostInput(e.target.value);
              onChange({ shippingCost: Math.round((parseFloat(e.target.value) || 0) * 100) });
            }}
          />
        </div>
      </div>

      <div>
        <label className="label">Códigos postales</label>
        <div className="flex gap-2">
          <input
            className="input flex-1 text-sm"
            placeholder="Ej: 1424"
            value={newZip}
            onChange={(e) => setNewZip(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addZip(); } }}
          />
          <button type="button" onClick={addZip} className="btn-secondary text-sm flex items-center gap-1.5">
            <Plus size={14} /> Agregar
          </button>
        </div>
        {zone.zipCodes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {zone.zipCodes.map((z) => (
              <span key={z} className="inline-flex items-center gap-1 bg-white text-slate-700 text-xs font-mono px-2.5 py-1 rounded-full border border-slate-200">
                {z}
                <button type="button" onClick={() => onChange({ zipCodes: zone.zipCodes.filter((x) => x !== z) })} className="text-slate-500 hover:text-red-400 ml-0.5 transition-colors">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
