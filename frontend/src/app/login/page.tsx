"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HardHat, ArrowRight, Loader2, Building2, ShoppingCart, Package, Truck } from "lucide-react";
import { authApi } from "@/lib/auth";

const DEMO_USERS = [
  { label: "Comprador", email: "buyer@obraya.com", password: "obraya123", icon: Package, color: "bg-green-500 hover:bg-green-600" },
  { label: "Delivery", email: "delivery@obraya.com", password: "obraya123", icon: Truck, color: "bg-blue-500 hover:bg-blue-600" },
  { label: "Arquitecto", email: "arq@obraya.com", password: "obraya123", icon: Building2, color: "bg-dark-800 hover:bg-dark-900" },
  { label: "Comercio", email: "comercio@obraya.com", password: "obraya123", icon: ShoppingCart, color: "bg-brand-500 hover:bg-brand-600" },
  { label: "Admin", email: "admin@obraya.com", password: "obraya123", icon: HardHat, color: "bg-amber-500 hover:bg-amber-600" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await authApi.login({ email, password });
      if (result.user.role === "BUYER") {
        router.push("/buyer/dashboard");
      } else if (result.user.role === "DELIVERY") {
        router.push("/delivery/dashboard");
      } else if (result.user.role === "ARQUITECTO") {
        router.push("/arquitecto/dashboard");
      } else if (result.user.role === "COMERCIO") {
        router.push("/comercio/dashboard");
      } else if (result.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err?.message || "Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo(demo: typeof DEMO_USERS[0]) {
    setError(null);
    setDemoLoading(demo.label);
    try {
      const result = await authApi.login({ email: demo.email, password: demo.password });
      if (result.user.role === "BUYER") {
        router.push("/buyer/dashboard");
      } else if (result.user.role === "DELIVERY") {
        router.push("/delivery/dashboard");
      } else if (result.user.role === "ARQUITECTO") {
        router.push("/arquitecto/dashboard");
      } else if (result.user.role === "COMERCIO") {
        router.push("/comercio/dashboard");
      } else if (result.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err?.message || "Error al ingresar con cuenta demo");
    } finally {
      setDemoLoading(null);
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

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-4">

          {/* Demo access */}
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-700 mb-3">Acceso rápido — cuentas de prueba</p>
            <div className="grid grid-cols-2 gap-3">
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.label}
                  onClick={() => handleDemo(demo)}
                  disabled={demoLoading !== null}
                  className={`flex items-center justify-center gap-2 ${demo.color} text-white text-sm font-bold py-3 rounded-xl transition disabled:opacity-60`}
                >
                  {demoLoading === demo.label ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <demo.icon className="w-4 h-4" />
                  )}
                  {demo.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-brand-600 mt-3 text-center">Contraseña: <span className="font-mono font-bold">obraya123</span></p>
          </div>

          {/* Login form */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <h1 className="text-2xl font-extrabold mb-1">Ingresar con tu cuenta</h1>
            <p className="text-gray-500 text-sm mb-6">Accedé a tu cuenta de ObraYa</p>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full bg-dark-900 hover:bg-dark-800 disabled:opacity-60 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-600">
              ¿No tenés cuenta?{" "}
              <Link href="/signup" className="text-brand-600 font-semibold hover:underline">
                Registrate gratis
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500">
            Al continuar aceptás nuestros <a href="#" className="underline">Términos</a> y{" "}
            <a href="#" className="underline">Política de Privacidad</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
