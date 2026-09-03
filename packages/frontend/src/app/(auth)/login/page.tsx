'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, HardHat } from 'lucide-react';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'SuperAdmin') {
        router.push('/superadmin/dashboard');
      } else if (user.role === 'Logistica') {
        router.push('/delivery');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500 shadow-lg shadow-orange-200 mb-4">
            <HardHat size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Obra<span className="text-orange-500">Ya</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Accedé a tu panel de gestión</p>
        </div>

        {/* Card */}
        <div className="card-ios p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                required
                autoComplete="email"
                className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 pr-12 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-600 text-sm rounded-xl px-4 py-3 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 disabled:opacity-60 transition-colors btn-ios mt-1"
            >
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="text-orange-500 font-semibold hover:underline">
              Registrá tu empresa
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-300 mt-6">
          ¿Buscás materiales?{' '}
          <Link href="/marketplace" className="text-slate-400 hover:text-orange-500 transition-colors">
            Ir al marketplace
          </Link>
        </p>
      </div>
    </div>
  );
}
