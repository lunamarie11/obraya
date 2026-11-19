import { OrderStatus } from '../orders/entities/order.entity';

// Bug #10 (QA 18/11/2026): los mails de estado del pedido eran texto plano con
// solo el número de pedido, sin acentos (Gmail ofrecía "Traducir al
// español") y sin detalle. Plantilla HTML con tablas y estilos inline (lo
// único que respetan Gmail/Outlook), lang="es", detalle del pedido y botones.

export interface OrderEmailData {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  buyerFirstName?: string | null;
  companyName?: string | null;
  items: Array<{ productName: string; quantity: number; subtotal: number | string }>;
  shippingCost?: number | string | null;
  totalAmount: number | string;
  deliveryAddress?: { street?: string; city?: string; province?: string; postalCode?: string } | null;
  date: Date;
  rejectionReason?: string | null;
}

export interface OrderEmailContext {
  frontendUrl: string;
  supportEmail?: string | null;
}

const ORANGE = '#f97316';

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Montos en centavos (igual que formatARS del frontend).
export function formatARS(cents: number | string | null | undefined): string {
  const value = Number(cents ?? 0) / 100;
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
}

// "18 de noviembre de 2026 a las 15:30 hs", siempre en hora de Argentina
// (el servidor corre en UTC).
function formatDateTime(date: Date): string {
  const tz = 'America/Argentina/Buenos_Aires';
  const day = new Intl.DateTimeFormat('es-AR', { dateStyle: 'long', timeZone: tz }).format(date);
  const time = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: tz,
  }).format(date);
  return `${day} a las ${time} hs`;
}

function button(href: string, label: string, primary = true): string {
  const style = primary
    ? `background:${ORANGE};color:#ffffff;border:1px solid ${ORANGE};`
    : `background:#ffffff;color:${ORANGE};border:1px solid ${ORANGE};`;
  return `<a href="${escapeHtml(href)}" style="${style}display:inline-block;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;text-decoration:none;margin:4px 6px 4px 0;">${escapeHtml(label)}</a>`;
}

function itemsTable(data: OrderEmailData): string {
  const rows = data.items
    .map(
      (i) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;">${escapeHtml(i.productName)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#475569;font-size:14px;text-align:center;white-space:nowrap;">x ${escapeHtml(i.quantity)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;text-align:right;white-space:nowrap;">${formatARS(i.subtotal)}</td>
        </tr>`,
    )
    .join('');

  const shipping = Number(data.shippingCost ?? 0);
  const shippingRow =
    shipping > 0
      ? `<tr><td colspan="2" style="padding:8px 0;color:#475569;font-size:14px;">Envío</td><td style="padding:8px 0;color:#0f172a;font-size:14px;text-align:right;">${formatARS(shipping)}</td></tr>`
      : '';

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 4px;">
      ${rows}
      ${shippingRow}
      <tr>
        <td colspan="2" style="padding:10px 0 0;color:#0f172a;font-size:15px;font-weight:700;">Total</td>
        <td style="padding:10px 0 0;color:#0f172a;font-size:15px;font-weight:700;text-align:right;white-space:nowrap;">${formatARS(data.totalAmount)}</td>
      </tr>
    </table>`;
}

function deliveryLine(data: OrderEmailData): string {
  const a = data.deliveryAddress;
  if (!a || !a.street) return 'Retiro en el local del vendedor';
  return [a.street, a.city, a.province, a.postalCode ? `CP ${a.postalCode}` : '']
    .filter(Boolean)
    .map(escapeHtml)
    .join(', ');
}

interface StatusCopy {
  subject: string;
  title: string;
  intro: string;
}

function statusCopy(data: OrderEmailData): StatusCopy | null {
  const seller = data.companyName ? escapeHtml(data.companyName) : 'el vendedor';
  const sellerPlain = data.companyName ?? 'tu vendedor';
  const num = `<strong>${escapeHtml(data.orderNumber)}</strong>`;
  const when = formatDateTime(data.date);

  switch (data.status) {
    case OrderStatus.ACEPTADO:
      return {
        subject: `${sellerPlain} aceptó tu pedido ${data.orderNumber}`,
        title: '¡Tu pedido fue aceptado!',
        intro: `${seller} aceptó tu pedido ${num} y ya lo está por preparar. Te avisamos cuando salga.`,
      };
    case OrderStatus.PREPARACION:
      return {
        subject: `Tu pedido ${data.orderNumber} está en preparación`,
        title: 'Estamos preparando tu pedido',
        intro: `${seller} está preparando tu pedido ${num}.`,
      };
    case OrderStatus.DESPACHADO:
      return {
        subject: `Tu pedido de ${sellerPlain} está en camino`,
        title: '¡Tu pedido está en camino!',
        intro: `Tu pedido ${num} salió el ${when}. Podés seguirlo desde la app.`,
      };
    case OrderStatus.ENTREGADO:
      return {
        subject: `¡Tu pedido de ${sellerPlain} ya fue entregado!`,
        title: '¡Tu pedido fue entregado!',
        intro: `Tu pedido ${num} fue entregado el ${when}.`,
      };
    case OrderStatus.CANCELADO:
      return {
        subject: `Tu pedido ${data.orderNumber} fue cancelado`,
        title: 'Tu pedido fue cancelado',
        intro: `Tu pedido ${num} fue cancelado${
          data.rejectionReason ? `. Motivo: ${escapeHtml(data.rejectionReason)}` : ''
        }.`,
      };
    default:
      return null;
  }
}

export function renderOrderStatusEmail(
  data: OrderEmailData,
  ctx: OrderEmailContext,
): { subject: string; html: string } | null {
  const copy = statusCopy(data);
  if (!copy) return null;

  const base = ctx.frontendUrl.replace(/\/+$/, '');
  const orderUrl = `${base}/my-orders/${encodeURIComponent(data.orderId)}`;
  const greeting = data.buyerFirstName ? `Hola ${escapeHtml(data.buyerFirstName)},` : 'Hola,';

  const buttons =
    data.status === OrderStatus.ENTREGADO
      ? button(orderUrl, 'Ver mi pedido') + button(`${orderUrl}#calificar`, 'Calificar al vendedor', false)
      : button(orderUrl, 'Ver mi pedido');

  const support = ctx.supportEmail
    ? `<p style="margin:20px 0 0;color:#475569;font-size:13px;line-height:1.5;">${
        data.status === OrderStatus.ENTREGADO
          ? '¿Hubo algún problema con la entrega?'
          : '¿Tenés alguna consulta sobre tu pedido?'
      } Escribinos a <a href="mailto:${escapeHtml(ctx.supportEmail)}" style="color:${ORANGE};">${escapeHtml(ctx.supportEmail)}</a>.</p>`
    : '';

  const showDetail = data.items.length > 0;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Language" content="es">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(copy.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;">
      <tr>
        <td style="padding:20px 28px;border-bottom:1px solid #f1f5f9;">
          <img src="${escapeHtml(base)}/icon.png" width="32" height="32" alt="" style="vertical-align:middle;border-radius:8px;">
          <span style="vertical-align:middle;margin-left:8px;font-size:20px;font-weight:800;color:#0f172a;">Obra<span style="color:${ORANGE};">Ya</span></span>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:22px;color:#0f172a;">${escapeHtml(copy.title)}</h1>
          <p style="margin:0 0 6px;color:#334155;font-size:15px;line-height:1.5;">${greeting}</p>
          <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.5;">${copy.intro}</p>
          ${
            showDetail
              ? `<p style="margin:0;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;">Detalle</p>
          ${itemsTable(data)}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 4px;">
            <tr><td style="padding:3px 0;color:#64748b;font-size:13px;width:110px;">Vendido por</td><td style="padding:3px 0;color:#0f172a;font-size:13px;">${escapeHtml(data.companyName ?? '—')}</td></tr>
            <tr><td style="padding:3px 0;color:#64748b;font-size:13px;">Entrega</td><td style="padding:3px 0;color:#0f172a;font-size:13px;">${deliveryLine(data)}</td></tr>
          </table>`
              : ''
          }
          <div style="margin-top:22px;">${buttons}</div>
          ${support}
          <p style="margin:24px 0 0;color:#0f172a;font-size:14px;">¡Gracias por comprar en ObraYa!</p>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0;color:#94a3b8;font-size:11px;">Este mail se envía automáticamente. ObraYa — materiales de construcción.</p>
  </td></tr>
</table>
</body>
</html>`;

  return { subject: copy.subject, html };
}
