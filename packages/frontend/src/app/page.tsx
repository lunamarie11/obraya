import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-800">
      <header className="max-w-7xl mx-auto p-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">ObraYa</h1>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-slate-600 hover:underline">Entrar</Link>
          <Link href="/register" className="text-sm text-slate-600 hover:underline">Registrarse</Link>
          <Link href="/superadmin" className="text-sm text-slate-600 hover:underline">Backoffice</Link>
        </nav>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-16 grid gap-12 lg:grid-cols-2 items-center">
        <div>
          <h2 className="text-5xl font-extrabold leading-tight mb-4">La plataforma que transforma la venta de materiales de construcción</h2>
          <p className="text-lg text-slate-600 mb-6">Conecta fabricantes y distribuidores con profesionales y particulares. Catálogo inteligente, control de stock, pedidos y logística integrados — todo pensado para escalar.</p>

          <div className="flex gap-3 mb-6">
            <Link href="/register" className="px-6 py-3 bg-orange-500 text-white rounded-full shadow hover:bg-orange-600">Crear cuenta</Link>
            <Link href="/superadmin/monitoring" className="px-6 py-3 border border-slate-200 rounded-full">Ver demo admin</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded flex items-center justify-center font-semibold">✓</div>
              <div>
                <div className="font-medium">Gestión de catálogo</div>
                <div className="text-xs">Subí productos masivamente, controla precios y SKUs.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded flex items-center justify-center font-semibold">⚡</div>
              <div>
                <div className="font-medium">Pedidos y logística</div>
                <div className="text-xs">Flujo completo desde el pedido hasta la entrega.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="order-first lg:order-last">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=0f3b2f6f5f8e8e3d" alt="Construccion" className="w-full h-64 object-cover" />
            <div className="p-6">
              <h3 className="text-lg font-semibold">Optimiza tu operación</h3>
              <p className="text-sm text-slate-600 mt-2">Panel intuitivo para administrar productos, precios y órdenes con métricas en tiempo real.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-2xl font-bold mb-6">Módulos principales</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Feature title="Catálogo inteligente" desc="Busqueda, filtros y variantes para cientos de SKUs." />
            <Feature title="Backoffice para comercios" desc="Control de stock, precios y promociones." />
            <Feature title="Logística integrada" desc="Seguimiento y pruebas de entrega con reportes." />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <h3 className="text-2xl font-bold mb-6">Lo que dicen nuestros usuarios</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Testimonial name="Martín - Distribuidor" body="Reducimos faltantes de stock y aumentamos ventas online 28% en 2 meses." />
          <Testimonial name="Lucía - Constructora" body="Buscar y pedir materiales ahora es mucho más rápido para mi equipo." />
          <Testimonial name="Diego - Fabricante" body="El backoffice nos permitió automatizar precios por volumen." />
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div>© {new Date().getFullYear()} ObraYa</div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="#" className="text-slate-300 hover:text-white text-sm">Política de privacidad</Link>
            <Link href="#" className="text-slate-300 hover:text-white text-sm">Términos</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-6 border rounded-lg">
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-sm text-slate-600">{desc}</p>
    </div>
  );
}

function Testimonial({ name, body }: { name: string; body: string }) {
  return (
    <blockquote className="p-6 border rounded-lg bg-slate-50">
      <p className="text-sm text-slate-700">“{body}”</p>
      <footer className="mt-3 text-xs text-slate-500">— {name}</footer>
    </blockquote>
  );
}

