"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { HardHat, ArrowRight, Loader2, Building2, ShoppingCart, CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/auth";

type Role = "ARQUITECTO" | "COMERCIO";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRole = (searchParams.get("role") || "").toUpperCase() as Role | "";

  const [step, setStep] = useState<1 | 2>(preselectedRole ? 2 : 1);
  const [role, setRole] = useState<Role | null>(
    preselectedRole === "ARQUITECTO" || preselectedRole === "COMERCIO" ? preselectedRole : null
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setError(null);
    setLoading(true);
    try {
      const result = await authApi.register({ name, email, password, role });
      if (result.user.role === "ARQUITECTO") {
        router.push("/arquitecto/dashboard");
      } else {
        router.push("/comercio/dashboard");
      }
    } catch (err: any) {
      setError(err?.message || "No pudimos crear tu cuenta. Probá con otro email.");
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
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`w-8 h-1.5 rounded-full ${step >= 1 ? "bg-brand-500" : "bg-gray-200"}`} />
            <div className={`w-8 h-1.5 rounded-full ${step >= 2 ? "bg-brand-500" : "bg-gray-200"}`} />
          </div>

          {step === 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <h1 className="text-3xl font-extrabold mb-2">¿Cuál es tu perfil?</h1>
              <p className="text-gray-600 mb-8">Elegí el rol que mejor se ajuste a tu trabajo.</p>

              <div className="space-y-3">
                <button
                  onClick={() => { setRole("ARQUITECTO"); setStep(2); }}
                  className="w-full text-left bg-white border-2 border-gray-100 hover:border-navy-500 rounded-xl p-5 transition group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-navy-50 text-navy-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-dark-900 mb-1">Soy Arquitecto</div>
                      <div className="text-sm text-gray-600">Gestiono obras, proyectos y presupuestos.</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-navy-500 mt-3" />
                  </div>
                </button>

                <button
                  onClick={() => { setRole("COMERCIO"); setStep(2); }}
                  className="w-full text-left bg-white border-2 border-gray-100 hover:border-brand-500 rounded-xl p-5 transition group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-dark-900 mb-1">Soy Comercio</div>
                      <div className="text-sm text-gray-600">Vendo materiales y gestiono logística.</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-brand-500 mt-3" />
                  </div>
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-600">
                ¿Ya tenés cuenta?{" "}
                <Link href="/login" className="text-brand-600 font-semibold hover:underline">
                  Iniciar sesión
                </Link>
              </div>
            </div>
          )}

          {step === 2 && role && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <button
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-dark-900 mb-4 inline-flex items-center gap-1"
              >
                ← Cambiar perfil
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${role === "ARQUITECTO" ? "bg-navy-50 text-navy-500" : "bg-brand-50 text-brand-600"}`}>
                  {role === "ARQUITECTO" ? <Building2 className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-xs text-gray-500">Registrándote como</div>
                  <div className="font-bold text-dark-900">{role === "ARQUITECTO" ? "Arquitecto" : "Comercio"}</div>
                </div>
              </div>

              <h1 className="text-2xl font-extrabold mb-2">Creá tu cuenta</h1>
              <p className="text-gray-600 mb-6 text-sm">Solo necesitamos estos datos para empezar.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-dark-900">Nombre completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>

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
                  <label className="block text-sm font-semibold mb-2 text-dark-900">Contraseña</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1.5">
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-success-500" /> Gratis para siempre</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-success-500" /> Sin tarjeta de crédito</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-success-500" /> Listo en 1 minuto</div>
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
                      Creando cuenta...
                    </>
                  ) : (
                    <>
                      Crear cuenta
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-600">
                ¿Ya tenés cuenta?{" "}
                <Link href="/login" className="text-brand-600 font-semibold hover:underline">
                  Iniciar sesión
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <SignupForm />
    </Suspense>
  );
}
