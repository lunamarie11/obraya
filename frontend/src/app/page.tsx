"use client";

import Link from "next/link";
import {
  HardHat,
  ArrowRight,
  Building2,
  ShoppingCart,
  Calculator,
  Truck,
  LayoutDashboard,
  Kanban,
  MapPin,
  Package,
  CheckCircle2,
  Star,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Dashboard de obras",
    description: "Visualizá todas tus obras en un solo lugar. Estado, avance, presupuesto y alertas en tiempo real.",
  },
  {
    icon: Kanban,
    title: "Gestión de tareas",
    description: "Kanban con tareas por etapa, asignación de contratistas y control de plazos y dependencias.",
  },
  {
    icon: Calculator,
    title: "Presupuesto inteligente",
    description: "Calculadora llave en mano, control de gastos y comparativas de cotizaciones automáticas.",
  },
  {
    icon: ShoppingCart,
    title: "Marketplace integrado",
    description: "Comprá materiales directo desde la app. Catálogo de comercios verificados con mejores precios.",
  },
  {
    icon: Truck,
    title: "Logística con GPS",
    description: "Seguimiento en tiempo real de tus pedidos. Sabé exactamente dónde está cada entrega.",
  },
  {
    icon: Package,
    title: "Gestión de inventario",
    description: "Stock en vivo, órdenes automáticas y reportes de ventas para comercios del rubro.",
  },
];

const steps = [
  {
    number: "01",
    title: "Creá tu cuenta",
    description: "Registrate gratis en menos de 1 minuto con tu email. Sin tarjeta de crédito.",
  },
  {
    number: "02",
    title: "Elegí tu perfil",
    description: "Arquitecto o Comercio: cada rol accede a las herramientas específicas que necesita.",
  },
  {
    number: "03",
    title: "Empezá a operar",
    description: "Cargá tu primera obra o tu catálogo y comenzá a gestionar todo desde un solo lugar.",
  },
];

const testimonials = [
  {
    name: "Martín Rodríguez",
    role: "Arquitecto, Estudio MR",
    quote: "Antes manejaba las obras con planillas y WhatsApp. ObraYa me ahorra 10 horas por semana y mis clientes ven el avance en vivo.",
    rating: 5,
  },
  {
    name: "Laura Giménez",
    role: "Dueña, Pinturería Central",
    quote: "Desde que sumé mi comercio al marketplace aumenté un 40% las ventas. Los arquitectos nos encuentran directo.",
    rating: 5,
  },
  {
    name: "Diego Paredes",
    role: "Contratista, DP Construcciones",
    quote: "La gestión de tareas por obra y el control de presupuesto cambiaron completamente cómo trabajamos. Imprescindible.",
    rating: 5,
  },
];

const stats = [
  { value: "+500", label: "Obras activas" },
  { value: "+200", label: "Comercios aliados" },
  { value: "98%", label: "Satisfacción de clientes" },
  { value: "24/7", label: "Soporte disponible" },
];

const roleCards = [
  {
    title: "Arquitecto",
    description: "Planificá tus obras con control completo de etapas, presupuesto y equipos.",
    href: "/signup?role=arquitecto",
    icon: Building2,
    color: "from-navy-600 to-navy-800",
  },
  {
    title: "Comercio",
    description: "Vendé materiales y gestioná tu stock, precios y logística centralizada.",
    href: "/signup?role=comercio",
    icon: ShoppingCart,
    color: "from-brand-500 to-brand-700",
  },
  {
    title: "Buyer",
    description: "Comprá materiales rápido, compará precios y seguí tu pedido en todo momento.",
    href: "/signup?role=buyer",
    icon: Package,
    color: "from-emerald-500 to-emerald-700",
  },
  {
    title: "Delivery",
    description: "Aceptá pedidos, gestioná entregas y ganá con cada viaje desde la app.",
    href: "/signup?role=delivery",
    icon: Truck,
    color: "from-sky-500 to-sky-700",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-dark-900">
      {/* ============ NAVBAR ============ */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-brand-500 rounded-lg flex items-center justify-center">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">ObraYa</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-dark-900 transition">Plataforma</a>
            <a href="#roles" className="hover:text-dark-900 transition">Roles</a>
            <a href="#como-funciona" className="hover:text-dark-900 transition">Cómo funciona</a>
            <a href="#testimonios" className="hover:text-dark-900 transition">Clientes</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-dark-900 transition">
              Iniciar sesión
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold bg-dark-900 text-white px-4 py-2 rounded-lg hover:bg-dark-800 transition"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-brand-50/30 to-white pt-20 pb-24">
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #1A252F 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-1.5 rounded-full text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Plataforma integral de construcción
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05]">
            La plataforma para arquitectos,<br />
            comercios, buyers y delivery
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Gestioná obras, presupuestos, compras y logística desde una única app. Cada rol tiene su espacio y sus herramientas.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-brand-500/30 hover:shadow-xl hover:-translate-y-0.5"
            >
              Comenzar ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-dark-900 text-dark-900 font-bold px-8 py-4 rounded-xl transition-all"
            >
              Ya tengo cuenta
            </Link>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto pt-10 border-t border-gray-100">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-extrabold text-dark-900">{s.value}</div>
                <div className="text-xs md:text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ROLES ============ */}
      <section id="roles" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3">Tu rol, tu app</div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Cuatro experiencias específicas para cada equipo</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Elegí tu perfil y accedé directamente a la interfaz con flujos hechos para vos.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {roleCards.map((role) => (
              <Link
                key={role.title}
                href={role.href}
                className={`group block rounded-3xl p-6 transition-all border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 ${role.color} bg-gradient-to-br text-white`}
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <role.icon className="w-6 h-6" />
                  </div>
                  <div className="text-xs uppercase tracking-[0.24em] font-bold opacity-80">Nuevo</div>
                </div>
                <div className="mt-8">
                  <h3 className="text-xl font-extrabold mb-3">{role.title}</h3>
                  <p className="text-sm text-white/80 leading-relaxed">{role.description}</p>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white/90 group-hover:text-white">
                  Comenzar ahora
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3">Todo en un solo lugar</div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Herramientas que funcionan juntas</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Seis módulos pensados para todo el ciclo de una obra: desde la planificación hasta la entrega final.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3">Todo en un solo lugar</div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Herramientas que funcionan juntas</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Seis módulos pensados para todo el ciclo de una obra: desde la planificación hasta la entrega final.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PARA QUIÉN ============ */}
      <section id="para-quien" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3">Pensado para equipos</div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Un producto para los cuatro roles clave</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ObraYa entrega una experiencia dedicada según tu función: arquitecto, comercio, buyer o delivery.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-gray-100 p-8 hover:shadow-xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-navy-50 text-navy-700 flex items-center justify-center mb-5">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Arquitecto</h3>
              <p className="text-gray-600 mb-6">Controlá obras, tareas y presupuesto con un dashboard especializado.</p>
              <ul className="space-y-3 text-sm text-gray-600 mb-6">
                {["Gestión de obras", "Tareas por etapa", "Presupuesto inteligente", "Seguimiento en vivo"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup?role=arquitecto" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
                Empezar como Arquitecto
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="rounded-3xl border border-gray-100 p-8 hover:shadow-xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mb-5">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Comercio</h3>
              <p className="text-gray-600 mb-6">Vendé materiales con pedidos online, inventario y métricas en un solo tablero.</p>
              <ul className="space-y-3 text-sm text-gray-600 mb-6">
                {["Catálogo digital", "Pedidos en vivo", "Gestión de stock", "Reportes de venta"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup?role=comercio" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
                Empezar como Comercio
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="rounded-3xl border border-gray-100 p-8 hover:shadow-xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-5">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Buyer</h3>
              <p className="text-gray-600 mb-6">Comprá materiales rápido, compará comercios y seguí tus pedidos en tiempo real.</p>
              <ul className="space-y-3 text-sm text-gray-600 mb-6">
                {["Búsqueda de materiales", "Comparación de precios", "Seguimiento de pedidos", "Historial de compras"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup?role=buyer" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
                Empezar como Buyer
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="rounded-3xl border border-gray-100 p-8 hover:shadow-xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center mb-5">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Delivery</h3>
              <p className="text-gray-600 mb-6">Aceptá pedidos, manejá rutas y ganá con cada entrega desde tu panel.</p>
              <ul className="space-y-3 text-sm text-gray-600 mb-6">
                {["Órdenes disponibles", "Aceptación rápida", "Seguimiento de entregas", "Dashboard de ganancias"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup?role=delivery" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
                Empezar como Delivery
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CÓMO FUNCIONA ============ */}
      <section id="como-funciona" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3">Simple y rápido</div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Empezá en 3 pasos</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Sin instalaciones, sin demos con vendedores. Te registrás y empezás a operar el mismo día.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="relative">
                <div className="text-6xl font-extrabold text-brand-500/20 mb-4">{step.number}</div>
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 -right-4 text-gray-300">
                    <ArrowRight className="w-8 h-8" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIOS ============ */}
      <section id="testimonios" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-3">Lo que dicen nuestros clientes</div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Construido con quienes construyen</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-brand-500 text-brand-500" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <div className="font-bold text-dark-900">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="py-24 bg-dark-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <MapPin className="w-12 h-12 text-brand-500 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            Llevá tu obra al siguiente nivel
          </h2>
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
            Sumate a cientos de arquitectos y comercios que ya gestionan su día a día con ObraYa. Es gratis empezar.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-bold px-8 py-4 rounded-xl transition shadow-lg shadow-brand-500/30"
            >
              Crear cuenta gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl transition backdrop-blur-sm"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-dark-900 border-t border-white/10 text-white/60 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                  <HardHat className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-extrabold text-white">ObraYa</span>
              </div>
              <p className="text-sm leading-relaxed">
                La plataforma integral para la industria de la construcción en Latinoamérica.
              </p>
            </div>

            <div>
              <div className="text-white font-bold text-sm mb-4">Plataforma</div>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#para-quien" className="hover:text-white transition">Para arquitectos</a></li>
                <li><a href="#para-quien" className="hover:text-white transition">Para comercios</a></li>
                <li><a href="#como-funciona" className="hover:text-white transition">Cómo funciona</a></li>
              </ul>
            </div>

            <div>
              <div className="text-white font-bold text-sm mb-4">Empresa</div>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Nosotros</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition">Prensa</a></li>
              </ul>
            </div>

            <div>
              <div className="text-white font-bold text-sm mb-4">Legal</div>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Términos</a></li>
                <li><a href="#" className="hover:text-white transition">Privacidad</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <div>© 2026 ObraYa. Todos los derechos reservados.</div>
            <div>hola@obraya.com</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
