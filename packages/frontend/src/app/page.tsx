import Link from 'next/link';
import Reveal from '@/components/Reveal';
import ScreenshotCarousel from '@/components/ScreenshotCarousel';
import DemoCredentials from '@/components/DemoCredentials';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-800">
      <header className="max-w-7xl mx-auto p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-extrabold">Obra<span className="text-orange-500">Ya</span></div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <Link href="/marketplace" className="hover:underline">Marketplace</Link>
            <Link href="/delivery" className="hover:underline">Delivery</Link>
            <Link href="/superadmin" className="hover:underline">Backoffice</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-sm">Entrar</Link>
          <Link href="/register" className="px-4 py-2 bg-orange-500 text-white rounded-full text-sm shadow hover:bg-orange-600">Registrarse</Link>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-24 grid gap-12 lg:grid-cols-2 items-center">
        <Reveal className="space-y-6">
          <div>
            <h2 className="text-5xl font-extrabold leading-tight mb-4">Materiales y servicios para la construcción — en una sola plataforma</h2>
            <p className="text-lg text-slate-600 mb-6">ObraYa conecta fabricantes, distribuidores y profesionales con un catálogo global, logística integrada y dashboards en tiempo real. Diseñado para empresas que escalan.</p>

            <div className="flex gap-3 mb-6">
              <Link href="/marketplace" className="px-6 py-3 bg-orange-500 text-white rounded-full shadow hover:bg-orange-600">Explorar Marketplace</Link>
              <Link href="/superadmin/monitoring" className="px-6 py-3 border border-slate-200 rounded-full">Ver demo admin</Link>
            </div>

              <div className="mt-4">
                <Reveal><DemoCredentials /></Reveal>
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center font-semibold">✓</div>
                <div>
                  <div className="font-medium">Catálogo global</div>
                  <div className="text-xs">Miles de SKUs, variantes y precios por volumen.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center font-semibold">⚡</div>
                <div>
                  <div className="font-medium">Logística y tracking</div>
                  <div className="text-xs">Seguimiento en tiempo real y optimización de rutas.</div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="order-first lg:order-last">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
              <div className="w-full h-96 bg-[url('https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?q=80&w=1400&auto=format&fit=crop&s=9f7e3d2b7f3c0f4e')] bg-cover bg-center"></div>
              <div className="p-6">
                <h3 className="text-lg font-semibold">Operá a escala internacional</h3>
                <p className="text-sm text-slate-600 mt-2">Panel corporativo, APIs abiertas y soporte para integraciones empresariales.</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-8">
        <Reveal>
          <h3 className="text-2xl font-bold mb-6">Screenshots</h3>
          <ScreenshotCarousel />
        </Reveal>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-2xl font-bold mb-6">Módulos principales</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Reveal><Feature title="Marketplace" desc="Catálogo unificado con ferreterías, distribuidores y productos. Búsqueda, filtros y checkout integrado." /></Reveal>
            <Reveal><Feature title="Delivery" desc="Asignación de riders, seguimiento en tiempo real y cálculo de ganancias por entrega." /></Reveal>
            <Reveal><Feature title="Arquitecto & Obras" desc="Gestión de proyectos, nómina de contratistas y calculadora por m2 para presupuestos rápidos." /></Reveal>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Reveal><Feature title="Backoffice (Admin)" desc="Panel separado para admins con gestión de usuarios, empresas y KPIs en tiempo real." /></Reveal>
            <Reveal><Feature title="KPIs y Dashboards" desc="Métricas en tiempo real por usuario, tienda o región: ventas, stock bajo, tiempo de entrega." /></Reveal>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <Reveal>
            <div>
              <h3 className="text-3xl font-bold mb-4">Misión</h3>
              <p className="text-lg text-slate-600 mb-6">Nuestra misión es empoderar a empresas del sector de la construcción con una plataforma SaaS empresarial que centraliza catálogo, ventas, logística y métricas en tiempo real para optimizar operaciones, reducir tiempos y aumentar la rentabilidad.</p>

              <h3 className="text-3xl font-bold mb-4">Visión</h3>
              <p className="text-lg text-slate-600">Ser la plataforma de referencia en Latinoamérica y luego globalmente, donde fabricantes, distribuidores y profesionales construyen, venden y gestionan proyectos con la mayor eficiencia y transparencia, impulsados por datos y automatización.</p>
            </div>
          </Reveal>

          <Reveal>
            <div className="bg-slate-50 p-6 rounded-xl border">
              <h4 className="text-xl font-semibold mb-3">Por qué elegir ObraYa</h4>
              <ul className="space-y-3 text-slate-600">
                <li>Integración completa: catálogo, stock, pedidos y entregas.</li>
                <li>KPIs en tiempo real y dashboards configurables.</li>
                <li>APIs abiertas y fácil integración con ERPs y marketplaces.</li>
                <li>Escalabilidad empresarial y soporte local.</li>
              </ul>
              <div className="mt-6">
                <Link href="/register" className="inline-block px-5 py-3 bg-orange-500 text-white rounded-md shadow">Comenzar ahora</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <h3 className="text-2xl font-bold mb-6">Clientes y casos de éxito</h3>
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

