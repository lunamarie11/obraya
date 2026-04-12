"use client";

import Link from "next/link";
import { Building2, ShoppingCart, ArrowRight, HardHat } from "lucide-react";

const roles = [
  {
    href: "/arquitecto/dashboard",
    icon: Building2,
    emoji: "🏗",
    title: "Arquitecto",
    subtitle: "Gestión de obras y proyectos",
    description: "Dashboard de obras, tareas, presupuesto, calculadora de materiales y control integral de cada proyecto.",
    features: ["Dashboard de obras", "Kanban de tareas", "Control de presupuesto", "Calculadora llave en mano", "Gestión de etapas y contratistas"],
    gradient: "from-navy-500 to-[#1A252F]",
    accent: "navy",
  },
  {
    href: "/comercio/dashboard",
    icon: ShoppingCart,
    emoji: "🏪",
    title: "Comercio",
    subtitle: "Marketplace y logística",
    description: "Métricas de ventas, catálogo de productos, gestión de pedidos y logística con seguimiento GPS en tiempo real.",
    features: ["Dashboard de ventas", "Marketplace de materiales", "Gestión de productos", "Seguimiento de pedidos", "Logística en tiempo real"],
    gradient: "from-brand-500 to-brand-700",
    accent: "brand",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-3 relative z-10">
        <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center">
          <HardHat className="w-7 h-7 text-white" />
        </div>
        <span className="text-3xl font-extrabold text-brand-500 tracking-tight">ObraYa</span>
      </div>
      <p className="text-gray-500 text-sm mb-12 relative z-10">Plataforma integral de construcción</p>

      {/* Role cards */}
      <div className="grid grid-cols-2 gap-6 max-w-4xl w-full relative z-10">
        {roles.map((role) => (
          <Link
            key={role.title}
            href={role.href}
            className="group relative bg-dark-800 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all hover:shadow-2xl hover:-translate-y-1"
          >
            {/* Top gradient bar */}
            <div className={`h-32 bg-gradient-to-br ${role.gradient} flex items-center justify-center relative`}>
              <span className="text-6xl">{role.emoji}</span>
              <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-xs font-semibold">
                Ingresar →
              </div>
            </div>

            <div className="p-6">
              <h2 className="text-xl font-extrabold text-white mb-1">{role.title}</h2>
              <p className="text-sm text-gray-400 mb-4">{role.description}</p>

              <div className="space-y-2">
                {role.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs text-gray-500">
                    <div className={`w-1.5 h-1.5 rounded-full ${role.accent === "navy" ? "bg-navy-500" : "bg-brand-500"}`} />
                    {f}
                  </div>
                ))}
              </div>

              <div className={`mt-6 flex items-center gap-2 text-sm font-bold ${role.accent === "navy" ? "text-navy-500" : "text-brand-500"} group-hover:gap-3 transition-all`}>
                Ingresar como {role.title}
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-gray-600 text-xs mt-10 relative z-10">
        ObraYa v0.1 · Demo local
      </p>
    </div>
  );
}
