import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidad - ObraYa',
  description: 'Política de privacidad y protección de datos personales de ObraYa',
};

export default function PrivacidadPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-slate-800">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Volver a ObraYa
      </Link>

      <h1 className="text-3xl font-bold mt-6 mb-2">Política de Privacidad</h1>
      <p className="text-sm text-slate-500 mb-8">Última actualización: 17 de noviembre de 2026</p>

      <div className="prose prose-slate max-w-none space-y-6 text-sm leading-relaxed">
        <section>
          <p>
            Esta Política de Privacidad describe cómo ObraYa recolecta, usa,
            almacena y protege los datos personales de sus usuarios
            (Compradores y Fabricantes), de conformidad con la Ley 25.326 de
            Protección de Datos Personales de la República Argentina y las
            disposiciones de la Agencia de Acceso a la Información Pública
            (AAIP).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">1. Datos que recolectamos</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Datos de registro:</strong> nombre, correo electrónico,
              teléfono, y en el caso de Fabricantes, razón social y CUIT.
            </li>
            <li>
              <strong>Datos de pedidos:</strong> productos solicitados,
              dirección de entrega, historial de compras.
            </li>
            <li>
              <strong>Datos de pago:</strong> ObraYa no almacena números de
              tarjeta ni credenciales bancarias. Los pagos se procesan a
              través de Mercado Pago, que gestiona esos datos bajo su propia
              política de privacidad.
            </li>
            <li>
              <strong>Datos fiscales:</strong> CUIT y condición ante el IVA,
              necesarios para la emisión de comprobantes electrónicos ante
              AFIP/ARCA.
            </li>
            <li>
              <strong>Datos técnicos:</strong> dirección IP, tipo de
              dispositivo y datos de uso de la plataforma, con fines de
              seguridad y mejora del servicio.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">2. Finalidad del tratamiento</h2>
          <p>Los datos recolectados se utilizan para:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Gestionar el registro y la autenticación de usuarios.</li>
            <li>Procesar pedidos, pagos y entregas.</li>
            <li>Emitir la facturación electrónica correspondiente.</li>
            <li>
              Enviar notificaciones operativas relacionadas con pedidos
              (correo electrónico, notificaciones push).
            </li>
            <li>Prevenir fraude y garantizar la seguridad de la plataforma.</li>
            <li>Dar soporte y responder consultas o reclamos.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">3. Con quién compartimos datos</h2>
          <p>ObraYa comparte datos personales únicamente con:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Mercado Pago</strong>, para procesar pagos.
            </li>
            <li>
              <strong>AFIP/ARCA</strong>, para la emisión de comprobantes
              fiscales electrónicos.
            </li>
            <li>
              <strong>El Fabricante correspondiente a cada pedido</strong>,
              en la medida necesaria para que pueda prepararlo y entregarlo
              (nombre, dirección de entrega y detalle del pedido).
            </li>
            <li>
              Proveedores de infraestructura tecnológica (hosting en AWS,
              envío de emails) que actúan como encargados de tratamiento
              bajo acuerdos de confidencialidad.
            </li>
          </ul>
          <p>
            ObraYa no vende ni cede datos personales a terceros con fines
            comerciales o publicitarios ajenos a la operación de la
            plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">4. Conservación de los datos</h2>
          <p>
            Los datos se conservan mientras la cuenta del usuario esté activa
            y, posteriormente, durante los plazos exigidos por la normativa
            fiscal y contable aplicable (incluyendo los comprobantes emitidos
            ante AFIP/ARCA).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">5. Derechos del usuario</h2>
          <p>
            Conforme a la Ley 25.326, el titular de los datos tiene derecho a
            acceder, rectificar, actualizar y, cuando corresponda, solicitar
            la supresión de sus datos personales. También puede ejercer el
            derecho de revocar su consentimiento. Para ejercer estos derechos
            puede contactarnos a través de los canales de soporte de la
            plataforma. El titular de los datos tiene también la facultad de
            presentar una denuncia ante la Agencia de Acceso a la Información
            Pública (AAIP), autoridad de control de la Ley 25.326.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">6. Seguridad</h2>
          <p>
            ObraYa aplica medidas técnicas y organizativas razonables para
            proteger los datos personales contra accesos no autorizados,
            pérdida o alteración, incluyendo cifrado de comunicaciones (HTTPS)
            y almacenamiento seguro de credenciales.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">7. Cambios en esta política</h2>
          <p>
            Esta Política de Privacidad puede actualizarse periódicamente. Los
            cambios relevantes serán informados a través de la plataforma.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">8. Contacto</h2>
          <p>
            Para consultas sobre esta Política de Privacidad o para ejercer
            sus derechos sobre sus datos personales, puede contactarnos a
            través de los canales de soporte disponibles en la plataforma.
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
