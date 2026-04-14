"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HardHat, ArrowRight, Loader2 } from "lucide-react";
import { authApi } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await authApi.login({ email, password });
      // Redirige según el rol del usuario
      if (result.user.role === "ARQUITECTO") {
        router.push("/arquitecto/dashboard");
      } else if (result.user.role === "COMERCIO") {
        router.push("/comercio/dashboard");
      } else {
        router.push("/select-role");
      }
    } catch (err: any) {
      setError(err?.message || "Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100 bg-white">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center">
            <HardHat className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-dark-900">ObraYa</span>
        </Link>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <h1 className="text-3xl font-extrabold mb-2">Ingresar</h1>
            <p className="text-gray-600 mb-8">Accedé a tu cuenta de ObraYa</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-dark-900">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-dark-900">Contraseña</label>
                  <a href="#" className="text-xs text-brand-600 hover:underline">¿Olvidaste tu contraseña?</a>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-danger-50 text-danger-600 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    Ingresar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-600">
              ¿No tenés cuenta?{" "}
              <Link href="/signup" className="text-brand-600 font-semibold hover:underline">
                Registrate gratis
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            Al continuar aceptás nuestros <a href="#" className="underline">Términos</a> y{" "}
            <a href="#" className="underline">Política de Privacidad</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
