"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { persistSession } from '@/lib/auth';

export default function DemoCredentials() {
  const users = [
    { email: 'delyanave@gmail.com', role: 'SUPER_ADMIN' },
    { email: 'buyer@obraya.com', role: 'VENDEDOR' },
    { email: 'delivery@obraya.com', role: 'LOGISTICA' },
    { email: 'arq@obraya.com', role: 'ADMIN' },
    { email: 'comercio@obraya.com', role: 'CONTABILIDAD' },
  ];

  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  async function demoLogin(email: string) {
    setError(null);
    setLoadingEmail(email);
    try {
      const payload: any = { email };
      if (process.env.NEXT_PUBLIC_DEMO_SECRET) payload.demoSecret = process.env.NEXT_PUBLIC_DEMO_SECRET;
      const res = await api.post('/auth/demo', payload);
      persistSession(res.data);
      setSuccess('Login demo exitoso — redirigiendo...');
      setTimeout(() => router.push('/'), 800);
    } catch (err: any) {
      console.error('Demo login failed', err);
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoadingEmail(null);
    }
  }

  return (
    <div className="p-4 rounded-lg bg-slate-50 border">
      <h4 className="font-semibold mb-2">Credenciales demo</h4>
      <div className="text-sm text-slate-600 mb-3">Usá estas cuentas para probar la aplicación en desarrollo.</div>
      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
      <ul className="text-sm space-y-2">
        {users.map((u) => (
          <li key={u.email} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{u.email}</div>
              <div className="text-xs text-slate-500">Rol: {u.role}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-700">Pass: <span className="font-medium">obraya123</span></div>
              <button
                onClick={() => demoLogin(u.email)}
                disabled={loadingEmail !== null}
                className="px-3 py-1 bg-orange-500 text-white rounded text-xs"
              >
                {loadingEmail === u.email ? 'Entrando...' : 'Demo'}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {success && <div className="mt-3 text-sm text-green-700">{success}</div>}
      <div className="mt-3 text-xs text-slate-500">API: <span className="font-mono">http://localhost:3010/api/v1</span></div>
    </div>
  );
}
