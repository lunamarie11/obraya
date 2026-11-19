import { OrderStatus } from '../../orders/entities/order.entity';
import { renderOrderStatusEmail, OrderEmailData } from '../order-email.template';
import { EmailService } from '../email.service';

// Bug #10 (QA 18/11/2026): mail de pedido entregado sin detalle, sin diseño,
// remitente "no-reply" y Gmail lo detectaba como otro idioma.
const base: OrderEmailData = {
  orderId: 'order-1',
  orderNumber: 'OBY-MWMAPBFK-M43',
  status: OrderStatus.ENTREGADO,
  buyerFirstName: 'Juan',
  companyName: 'Certezza',
  items: [
    { productName: 'Yeso x 1 KG', quantity: 2, subtotal: 300000 },
    { productName: 'Pastina <Blanca>', quantity: 1, subtotal: 230050 },
  ],
  shippingCost: 50000,
  totalAmount: 580050,
  deliveryAddress: { street: 'Av. Corrientes 1234', city: 'CABA', province: 'Buenos Aires', postalCode: '1043' },
  date: new Date('2026-11-18T18:30:00Z'),
};
const ctx = { frontendUrl: 'https://app.obraya.com.ar/', supportEmail: 'contacto@obraya.com.ar' };

describe('renderOrderStatusEmail()', () => {
  it('Entregado: asunto con el comercio, saludo, detalle, total, vendedor y dirección', () => {
    const { subject, html } = renderOrderStatusEmail(base, ctx)!;
    expect(subject).toBe('¡Tu pedido de Certezza ya fue entregado!');
    expect(html).toContain('<html lang="es">');
    expect(html).toContain('Hola Juan,');
    expect(html).toContain('OBY-MWMAPBFK-M43');
    expect(html).toContain('Yeso x 1 KG');
    expect(html).toContain('x 2');
    expect(html).toMatch(/Total[\s\S]*5\.800,50/);
    expect(html).toContain('Envío');
    expect(html).toContain('Vendido por');
    expect(html).toContain('Av. Corrientes 1234, CABA, Buenos Aires, CP 1043');
    // fecha y hora en horario de Argentina (18:30 UTC = 15:30)
    expect(html).toMatch(/18 de noviembre de 2026.*15:30/);
  });

  it('Entregado: botones "Ver mi pedido" y "Calificar al vendedor" y contacto', () => {
    const { html } = renderOrderStatusEmail(base, ctx)!;
    expect(html).toContain('href="https://app.obraya.com.ar/my-orders/order-1"');
    expect(html).toContain('href="https://app.obraya.com.ar/my-orders/order-1#calificar"');
    expect(html).toContain('Calificar al vendedor');
    expect(html).toContain('¿Hubo algún problema con la entrega?');
    expect(html).toContain('mailto:contacto@obraya.com.ar');
  });

  it('escapa HTML de datos cargados por usuarios', () => {
    const { html } = renderOrderStatusEmail(base, ctx)!;
    expect(html).toContain('Pastina &lt;Blanca&gt;');
    expect(html).not.toContain('<Blanca>');
  });

  it('sin dirección: dice retiro en el local', () => {
    const { html } = renderOrderStatusEmail({ ...base, deliveryAddress: null }, ctx)!;
    expect(html).toContain('Retiro en el local del vendedor');
  });

  it('estados intermedios: solo "Ver mi pedido", sin "Calificar"', () => {
    for (const status of [OrderStatus.ACEPTADO, OrderStatus.PREPARACION, OrderStatus.DESPACHADO]) {
      const { subject, html } = renderOrderStatusEmail({ ...base, status }, ctx)!;
      expect(subject).toContain(status === OrderStatus.DESPACHADO ? 'en camino' : base.orderNumber);
      expect(html).toContain('Ver mi pedido');
      expect(html).not.toContain('Calificar al vendedor');
    }
  });

  it('Cancelado incluye el motivo', () => {
    const { html } = renderOrderStatusEmail({ ...base, status: OrderStatus.CANCELADO, rejectionReason: 'Sin stock' }, ctx)!;
    expect(html).toContain('Motivo: Sin stock');
  });

  it('Nuevo no manda mail', () => {
    expect(renderOrderStatusEmail({ ...base, status: OrderStatus.NUEVO }, ctx)).toBeNull();
  });

  it('sin mail de soporte configurado no muestra la línea de contacto', () => {
    const { html } = renderOrderStatusEmail(base, { frontendUrl: 'https://app.obraya.com.ar' })!;
    expect(html).not.toContain('mailto:');
  });
});

describe('EmailService.withDisplayName()', () => {
  it('agrega "ObraYa" como nombre visible del remitente', () => {
    expect(EmailService.withDisplayName('no-reply@obraya.com.ar')).toBe('ObraYa <no-reply@obraya.com.ar>');
  });
  it('respeta un EMAIL_FROM que ya trae nombre', () => {
    expect(EmailService.withDisplayName('Equipo <x@obraya.com.ar>')).toBe('Equipo <x@obraya.com.ar>');
  });
});
