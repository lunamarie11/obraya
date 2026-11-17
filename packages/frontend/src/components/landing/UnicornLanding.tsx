import Link from 'next/link';
import {
  ArrowRight,
  Zap,
  ShieldCheck,
  Percent,
  Receipt,
  Search,
  Truck,
  PackageCheck,
  Building2,
  Sparkles,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Zap,
    title: 'Envío el mismo día',
    desc: 'Pedidos confirmados antes de las 14hs llegan a tu obra hoy mismo.',
  },
  {
    icon: Percent,
    title: 'Precios por volumen',
    desc: 'Descuentos automáticos a partir de ciertas cantidades, sin negociar.',
  },
  {
    icon: ShieldCheck,
    title: 'Fabricantes verificados',
    desc: 'Comprá directo de fábrica o distribuidor oficial, sin intermediarios.',
  },
  {
    icon: Receipt,
    title: 'Pago y factura en regla',
    desc: 'Mercado Pago para cobrar seguro y factura electrónica AFIP automática.',
  },
];

const STEPS = [
  { icon: Search, title: 'Buscá tu material', desc: 'Cemento, pisos, pintura, hierro — todo el catálogo de fabricantes verificados en un solo lugar.' },
  { icon: PackageCheck, title: 'Pedí directo al fabricante', desc: 'Sin intermediarios ni sobreprecio. Pagás seguro y recibís tu factura al instante.' },
  { icon: Truck, title: 'Lo recibís en tu obra', desc: 'Seguimiento del pedido de punta a punta, hasta que llega a destino.' },
];

interface Props {
  companiesCount?: number;
}

export function UnicornLanding({ companiesCount }: Props) {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/obraya-lockup.svg" alt="ObraYa" className="h-9 w-auto" />
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#como-funciona" className="hover:text-slate-900 transition-colors">Cómo funciona</a>
            <a href="#fabricantes" className="hover:text-slate-900 transition-colors">Para fabricantes</a>
            <Link href="/marketplace" className="hover:text-slate-900 transition-colors">Catálogo</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/account"
              className="hidden sm:inline-flex items-center h-10 px-4 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Ingresar
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200"
            >
              Explorar catálogo
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-20 pb-28 px-6">
        {/* Blobs decorativos */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-[32rem] h-[32rem] rounded-full bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 opacity-20 blur-3xl" />
        <div className="pointer-events-none absolute top-0 right-0 w-[28rem] h-[28rem] rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 opacity-20 blur-3xl" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-xs font-semibold px-3 py-1.5 mb-6">
            <Sparkles size={13} />
            El marketplace de materiales de construcción de Argentina
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
            Materiales de obra,{' '}
            <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              directo de fábrica
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto">
            ObraYa conecta a compradores, profesionales y constructoras con
            fabricantes y distribuidores verificados. Sin intermediarios,
            con pago seguro y factura electrónica automática.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
            >
              Comprar materiales
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white border border-slate-200 text-slate-900 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <Building2 size={18} />
              Soy fabricante o distribuidor
            </Link>
          </div>

          <p className="mt-5 text-xs text-slate-400">
            Próximamente disponible también en App Store y Google Play.
          </p>
        </div>

        {/* Stats */}
        <div className="relative max-w-4xl mx-auto mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: companiesCount ? `${companiesCount}+` : '—', label: 'Fabricantes activos' },
            { value: 'AMBA', label: 'Zona de entrega' },
            { value: '100%', label: 'Pago seguro' },
            { value: 'AFIP', label: 'Factura automática' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-slate-900">{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Todo lo que necesitás para tu obra
            </h2>
            <p className="mt-3 text-slate-500 max-w-xl mx-auto">
              Una experiencia de compra pensada para quien construye, no solo para quien vende.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
                  <f.icon size={20} className="text-orange-500" />
                </div>
                <h3 className="font-bold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Cómo funciona</h2>
            <p className="mt-3 text-slate-500">Tres pasos, de la búsqueda a la obra.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                  <step.icon size={26} />
                </div>
                <div className="mt-5 text-xs font-bold text-orange-500 tracking-wide">PASO {i + 1}</div>
                <h3 className="mt-1 text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Para fabricantes */}
      <section id="fabricantes" className="relative py-24 px-6 bg-slate-900 text-white overflow-hidden">
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-br from-orange-500 to-purple-600 opacity-20 blur-3xl" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold">¿Fabricás o distribuís materiales?</h2>
          <p className="mt-4 text-slate-300 max-w-xl mx-auto">
            Sumá tu catálogo a ObraYa y llegá a compradores, profesionales y
            constructoras de todo el AMBA. Cobrá seguro con Mercado Pago y
            facturá automático ante AFIP.
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
            >
              Registrar mi empresa
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="text-slate-400">© {new Date().getFullYear()} ObraYa</div>
          <div className="flex gap-6 text-slate-400">
            <Link href="/privacidad" className="hover:text-white transition-colors">Política de privacidad</Link>
            <Link href="/terminos" className="hover:text-white transition-colors">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
