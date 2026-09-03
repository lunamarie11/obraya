'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, User, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { register } from '@/lib/auth';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
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
    if (form.cuit.length !== 11) { setError('El CUIT debe tener 11 dígitos.'); return; }
    if (form.adminPassword.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="card-ios p-10 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
            <CheckCircle2 size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">¡Empresa registrada!</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Tu cuenta está pendiente de aprobación por el equipo ObraYa. Te avisamos por email cuando esté activa.
          </p>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center py-3.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors btn-ios"
          >
            Ir al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Obra<span className="text-orange-500">Ya</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Registrá tu empresa y empezá a vender</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company section */}
          <div className="card-ios p-6 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Building2 size={16} className="text-orange-500" /> Datos de la empresa
            </h3>
            <RegisterField label="CUIT (sin guiones)">
              <input
                className="field-base"
                placeholder="30500010912"
                maxLength={11}
                value={form.cuit}
                onChange={(e) => set('cuit', e.target.value.replace(/\D/g, ''))}
                required
              />
            </RegisterField>
            <RegisterField label="Razón social">
              <input
                className="field-base"
                placeholder="Cerámicas del Sur S.A."
                value={form.razonSocial}
                onChange={(e) => set('razonSocial', e.target.value)}
                required
              />
            </RegisterField>
            <RegisterField label="Email de la empresa">
              <input
                type="email"
                className="field-base"
                placeholder="contacto@empresa.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
              />
            </RegisterField>
            <RegisterField label="Provincia">
              <input
                className="field-base"
                placeholder="Buenos Aires"
                value={form.province}
                onChange={(e) => set('province', e.target.value)}
              />
            </RegisterField>
          </div>

          {/* Admin section */}
          <div className="card-ios p-6 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <User size={16} className="text-orange-500" /> Usuario administrador
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <RegisterField label="Nombre">
                <input
                  className="field-base"
                  placeholder="María"
                  value={form.adminFirstName}
                  onChange={(e) => set('adminFirstName', e.target.value)}
                  required
                />
              </RegisterField>
              <RegisterField label="Apellido">
                <input
                  className="field-base"
                  placeholder="González"
                  value={form.adminLastName}
                  onChange={(e) => set('adminLastName', e.target.value)}
                  required
                />
              </RegisterField>
            </div>
            <RegisterField label="Email del administrador">
              <input
                type="email"
                className="field-base"
                placeholder="admin@empresa.com"
                value={form.adminEmail}
                onChange={(e) => set('adminEmail', e.target.value)}
                required
              />
            </RegisterField>
            <RegisterField label="Contraseña (mínimo 8 caracteres)">
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="field-base pr-12"
                  placeholder="••••••••"
                  minLength={8}
                  value={form.adminPassword}
                  onChange={(e) => set('adminPassword', e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </RegisterField>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 disabled:opacity-60 transition-colors btn-ios shadow-sm"
          >
            {loading ? 'Registrando...' : 'Registrar empresa'}
          </button>

          <p className="text-center text-sm text-slate-400">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-orange-500 font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </div>

      <style jsx global>{`
        .field-base {
          width: 100%;
          background: #f1f5f9;
          border: none;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          transition: all 0.15s;
        }
        .field-base:focus {
          background: #ffffff;
          box-shadow: 0 0 0 2px #f97316;
        }
        .field-base::placeholder { color: #94a3b8; }
      `}</style>
    </div>
  );
}

function RegisterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
