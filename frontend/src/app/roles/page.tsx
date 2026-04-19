import Link from "next/link";
import { Building2, ShoppingCart, Package, Truck, ArrowRight } from "lucide-react";

const roleCards = [
  {
    title: "Arquitecto",
    description: "Accedé a obras, presupuestos y tareas con un panel hecho para diseño y gestión de proyectos.",
    href: "/arquitecto/dashboard",
    icon: Building2,
    accent: "from-navy-600 to-navy-800",
  },
  {
    title: "Comercio",
    description: "Administrá tu catálogo, pedidos y logística desde una experiencia pensada para comercios.",
    href: "/comercio/dashboard",
    icon: ShoppingCart,
    accent: "from-brand-500 to-brand-700",
  },
  {
    title: "Buyer",
    description: "Comprá materiales, compará precios y seguí tus pedidos desde un flujo de compra simple.",
    href: "/buyer/dashboard",
    icon: Package,
    accent: "from-emerald-500 to-emerald-700",
  },
  {
    title: "Delivery",
    description: "Recibí entregas, gestioná rutas y ganá con cada pedido desde un panel rápido y claro.",
    href: "/delivery/dashboard",
    icon: Truck,
    accent: "from-sky-500 to-sky-700",
  },
];

export default function RolesPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-dark-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">Roles de ObraYa</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Seleccioná tu experiencia en un solo lugar</h1>
            <p className="mt-4 max-w-2xl text-gray-600 leading-7">
              Todas las interfaces, desde arquitectos hasta delivery, están disponibles desde aquí. Cambiá rápido entre perfiles y comenzá con el rol que necesites.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-semibold text-gray-700 hover:text-dark-900 transition"
            >
              Volver a inicio
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition"
            >
              Registrarme
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {roleCards.map((role) => {
            const Icon = role.icon;
            return (
              <Link
                key={role.title}
                href={role.href}
                className={`group block rounded-[2rem] bg-gradient-to-br px-6 py-8 text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-1 ${role.accent}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="rounded-2xl bg-white/15 p-3">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs uppercase tracking-[0.3em] text-white/80 font-bold">Rol</span>
                </div>
                <div className="mt-8">
                  <h2 className="text-2xl font-extrabold mb-3">{role.title}</h2>
                  <p className="text-sm leading-6 text-white/80">{role.description}</p>
                </div>
                <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white/90 group-hover:text-white">
                  Ver experiencia
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
