'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    cuit: '',
    razonSocial: '',
    email: '',
    province: '',
    adminEmail: '',
    adminFirstName: '',
    adminLastName: '',
    adminPassword: '',
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al registrarse'));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">¡Empresa registrada!</h2>
          <p className="text-slate-500 mt-2 text-sm">
            Tu cuenta está pendiente de aprobación por el equipo ObraYa.
            Recibirás un email cuando esté activa.
          </p>
          <Link href="/login" className="btn-primary inline-block mt-6">Ir al login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Obra<span className="text-orange-500">Ya</span></h1>
          <p className="text-slate-500 mt-2">Registrá tu empresa</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="font-semibold text-slate-700 mb-3">Datos de la empresa</h3>
              <div className="space-y-3">
                <div>
                  <label className="label">CUIT (sin guiones)</label>
                  <input className="input" placeholder="30500010912" maxLength={11}
                    value={form.cuit} onChange={(e) => set('cuit', e.target.value.replace(/\D/g, ''))} required />
                </div>
                <div>
                  <label className="label">Razón social</label>
                  <input className="input" placeholder="Cerámicas del Sur S.A."
                    value={form.razonSocial} onChange={(e) => set('razonSocial', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Email de la empresa</label>
                  <input type="email" className="input" placeholder="contacto@empresa.com"
                    value={form.email} onChange={(e) => set('email', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Provincia</label>
                  <input className="input" placeholder="Buenos Aires"
                    value={form.province} onChange={(e) => set('province', e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-700 mb-3">Usuario administrador</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nombre</label>
                    <input className="input" value={form.adminFirstName} onChange={(e) => set('adminFirstName', e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Apellido</label>
                    <input className="input" value={form.adminLastName} onChange={(e) => set('adminLastName', e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="label">Email del administrador</label>
                  <input type="email" className="input" value={form.adminEmail} onChange={(e) => set('adminEmail', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Contraseña (mínimo 8 caracteres)</label>
                  <input type="password" className="input" minLength={8} value={form.adminPassword} onChange={(e) => set('adminPassword', e.target.value)} required />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? 'Registrando...' : 'Registrar empresa'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-orange-500 hover:underline font-medium">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
