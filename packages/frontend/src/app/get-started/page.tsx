import Link from 'next/link';
import { Building2, Bike, ShoppingCart, ArrowRight } from 'lucide-react';

// Selector de registro por tipo de usuario — ver requerimiento de 3 registros
// (Comercio / Delivery / Comprador) accesible desde el botón "Registrate" de
// la landing (ADR-026 para el repartidor independiente).
const OPTIONS = [
  {
    icon: Building2,
    title: 'Soy fabricante o distribuidor',
    desc: 'Cargá tu catálogo con productos, precios y stock, y vendé a compradores de todo el AMBA.',
    cta: 'Registrar mi empresa',
    href: '/register',
  },
  {
    icon: Bike,
    title: 'Quiero ser delivery',
    desc: 'Registrate con tus datos y tu vehículo, y empezá a recibir pedidos para entregar.',
    cta: 'Registrarme como delivery',
    href: '/delivery/register',
  },
  {
    icon: ShoppingCart,
    title: 'Quiero comprar materiales',
    desc: 'Mirá el catálogo de fabricantes verificados, comprá y recibí tu pedido en la obra.',
    cta: 'Crear mi cuenta',
    href: '/account/register',
  },
];

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/obraya-lockup.svg" alt="ObraYa" className="h-8 w-auto" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            ¿Cómo querés usar ObraYa?
          </h1>
          <p className="mt-3 text-slate-500 max-w-xl mx-auto">
            Elegí la opción que te describe mejor para crear tu cuenta.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {OPTIONS.map((opt) => (
            <Link
              key={opt.href}
              href={opt.href}
              className="group rounded-3xl bg-white border border-slate-100 p-7 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col"
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-5">
                <opt.icon size={22} className="text-orange-500" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">{opt.title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed flex-1">{opt.desc}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 group-hover:gap-2.5 transition-all">
                {opt.cta}
                <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
