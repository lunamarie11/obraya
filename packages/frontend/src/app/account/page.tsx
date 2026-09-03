'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, User } from 'lucide-react';
import { buyerLogin, buyerDemoLogin } from '@/lib/buyer-auth';
import { MarketplaceHeader } from '@/components/marketplace/MarketplaceHeader';
import { BottomTabBar } from '@/components/nav/BottomTabBar';

export default function AccountLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await buyerLogin(email, password);
      router.push('/my-orders');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setError('');
    setDemoLoading(true);
    try {
      await buyerDemoLogin('comprador@obraya.com');
      router.push('/my-orders');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Login demo falló');
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-tabbar">
      <MarketplaceHeader showSearch={false} showBack backHref="/marketplace" title="Mi cuenta" />

      <main className="max-w-sm mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500 shadow-lg shadow-orange-200 mb-4">
            <User size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Ingresá a tu cuenta</h1>
          <p className="text-slate-400 text-sm mt-1">Seguí tus pedidos y comprá más rápido.</p>
        </div>

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
                placeholder="tu@email.com"
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

          {process.env.NODE_ENV !== 'production' && (
            <button
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="w-full mt-3 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 disabled:opacity-60 transition-colors btn-ios text-sm"
            >
              {demoLoading ? 'Entrando...' : 'Probar con cuenta demo'}
            </button>
          )}

          <p className="text-center text-sm text-slate-400 mt-6">
            ¿No tenés cuenta?{' '}
            <Link href="/account/register" className="text-orange-500 font-semibold hover:underline">
              Creá una cuenta
            </Link>
          </p>
        </div>
      </main>
      <BottomTabBar />
    </div>
  );
}
