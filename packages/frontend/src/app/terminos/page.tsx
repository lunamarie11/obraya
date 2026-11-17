import Link from 'next/link';

export const metadata = {
  title: 'Términos y Condiciones - ObraYa',
  description: 'Términos y condiciones de uso de la plataforma ObraYa',
};

export default function TerminosPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-slate-800">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Volver a ObraYa
      </Link>

      <h1 className="text-3xl font-bold mt-6 mb-2">Términos y Condiciones</h1>
      <p className="text-sm text-slate-500 mb-8">Última actualización: 17 de noviembre de 2026</p>

      <div className="prose prose-slate max-w-none space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Quiénes somos</h2>
          <p>
            ObraYa es una plataforma digital que conecta a fabricantes y
            distribuidores de materiales de construcción (&quot;Fabricantes&quot;) con
            compradores finales, profesionales y empresas constructoras
            (&quot;Compradores&quot;), operada en la República Argentina. ObraYa actúa
            como intermediario tecnológico entre ambas partes: facilita el
            descubrimiento de productos, la gestión de pedidos, el cobro y la
            facturación, pero <strong>no es el vendedor de los productos
            ofrecidos</strong>. La relación de compraventa se establece entre
            el Comprador y el Fabricante correspondiente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">2. Aceptación de los términos</h2>
          <p>
            El uso de la plataforma ObraYa (sitio web, aplicación móvil y
            backoffice) implica la aceptación plena de estos Términos y
            Condiciones y de la{' '}
            <Link href="/privacidad" className="text-blue-600 hover:underline">
              Política de Privacidad
            </Link>
            . Si no está de acuerdo con alguna de estas condiciones, le
            pedimos que no utilice la plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. Registro de usuarios</h2>
          <p>
            Para realizar compras o administrar un catálogo como Fabricante es
            necesario registrarse con datos verdaderos, exactos y
            actualizados. El usuario es responsable de mantener la
            confidencialidad de sus credenciales de acceso y de toda actividad
            realizada desde su cuenta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Pedidos, precios y disponibilidad</h2>
          <p>
            Los precios, stock y condiciones de cada producto son definidos y
            actualizados por cada Fabricante, quien es el único responsable de
            su exactitud. ObraYa muestra la información tal como es provista
            por el Fabricante y no garantiza la disponibilidad permanente de
            un producto. Una vez confirmado un pedido, se informará al
            Comprador el estado del mismo (confirmado, en preparación, en
            camino, entregado) a través de la plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. Pagos</h2>
          <p>
            Los pagos realizados a través de ObraYa son procesados mediante{' '}
            <strong>Mercado Pago</strong>, una plataforma de pago de terceros.
            ObraYa no almacena datos de tarjetas ni medios de pago; estos son
            gestionados directamente por Mercado Pago conforme a sus propios
            términos y medidas de seguridad. Al completar un pago, el
            Comprador acepta además los términos del proveedor de pagos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">6. Facturación</h2>
          <p>
            ObraYa emite la facturación electrónica correspondiente a cada
            operación ante la Administración Federal de Ingresos Públicos
            (AFIP/ARCA), conforme a la normativa vigente, actuando en su rol
            de intermediario autorizado para la emisión de comprobantes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">7. Entregas y logística</h2>
          <p>
            Los plazos y zonas de entrega informados en la plataforma son
            estimativos y pueden variar según el Fabricante, la ubicación del
            Comprador y factores externos (climáticos, de tránsito, etc.).
            ObraYa no garantiza plazos exactos de entrega, aunque realiza
            esfuerzos razonables para mantener informado al Comprador sobre el
            estado de su pedido.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">8. Cancelaciones, cambios y devoluciones</h2>
          <p>
            Las condiciones de cancelación, cambio o devolución de un pedido
            se rigen por la Ley de Defensa del Consumidor (Ley 24.240) y por
            las políticas particulares de cada Fabricante, que se informan en
            la ficha del producto o al momento de la compra. Ante cualquier
            inconveniente, el Comprador puede iniciar un reclamo a través del
            canal de contacto de la plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">9. Responsabilidad</h2>
          <p>
            ObraYa no es responsable por la calidad, idoneidad o conformidad
            de los productos ofrecidos por los Fabricantes, cuya
            responsabilidad es exclusiva de estos últimos. ObraYa tampoco será
            responsable por interrupciones del servicio ajenas a su control
            razonable.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">10. Modificaciones</h2>
          <p>
            ObraYa puede modificar estos Términos y Condiciones en cualquier
            momento. Los cambios relevantes serán informados a través de la
            plataforma y entrarán en vigencia desde su publicación.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">11. Contacto</h2>
          <p>
            Ante dudas o reclamos relacionados con estos Términos y
            Condiciones, puede contactarnos a través de los canales de
            soporte disponibles en la plataforma.
          </p>
        </section>

        <section className="border-t border-slate-200 pt-6 mt-8">
          <p className="text-xs text-slate-500">
            Este documento es un borrador inicial redactado para la puesta en
            marcha de la plataforma y debe ser revisado por un profesional
            matriculado en derecho antes de considerarse definitivo.
          </p>
        </section>
      </div>
    </main>
  );
}
