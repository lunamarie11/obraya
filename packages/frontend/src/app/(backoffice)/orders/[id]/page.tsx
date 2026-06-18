'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, formatARS } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';
import {
  ArrowLeft, CheckCircle, XCircle, Truck, Package,
  Send, MapPin, Phone, Mail, AlertCircle,
} from 'lucide-react';

const STATUS_FLOW: Record<string, { next: string; label: string; color: string } | null> = {
  Nuevo:       { next: 'Aceptado',    label: 'Aceptar pedido',   color: 'bg-green-500 hover:bg-green-600' },
  Aceptado:    { next: 'Preparacion', label: 'Iniciar preparación', color: 'bg-blue-500 hover:bg-blue-600' },
  Preparacion: { next: 'Despachado',  label: 'Marcar despachado', color: 'bg-purple-500 hover:bg-purple-600' },
  Despachado:  { next: 'Entregado',   label: 'Confirmar entrega', color: 'bg-green-500 hover:bg-green-600' },
  Entregado:   null,
  Cancelado:   null,
};

const STATUS_BADGE: Record<string, string> = {
  Nuevo:       'bg-blue-100 text-blue-700',
  Aceptado:    'bg-indigo-100 text-indigo-700',
  Preparacion: 'bg-yellow-100 text-yellow-700',
  Despachado:  'bg-purple-100 text-purple-700',
  Entregado:   'bg-green-100 text-green-700',
  Cancelado:   'bg-red-100 text-red-700',
};

const QUICK_MESSAGES = [
  'Gracias por tu pedido. Lo estamos procesando.',
  'Tu pedido está en preparación.',
  'Tu pedido está listo para despacho.',
  'Tu pedido fue despachado. Pronto lo recibirás.',
  'Necesitamos confirmar un detalle de tu pedido. Te contactamos a la brevedad.',
];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [messageText, setMessageText] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [order?.messages?.length]);

  const updateStatus = useMutation({
    mutationFn: (body: { status: string; rejectionReason?: string }) =>
      api.put(`/orders/${id}/status`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      setCancelModal(false);
      setCancelReason('');
    },
  });

  const sendMessage = useMutation({
    mutationFn: (content: string) =>
      api.post(`/orders/${id}/messages`, { content, isPredefined: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      setMessageText('');
    },
  });

  if (isLoading) {
    return (
      <div>
        <Header title="Detalle de pedido" />
        <div className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 h-32 animate-pulse bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div>
        <Header title="Detalle de pedido" />
        <div className="p-6">
          <div className="card p-12 text-center text-slate-500">Pedido no encontrado.</div>
        </div>
      </div>
    );
  }

  const nextStep = STATUS_FLOW[order.status];
  const isFinal = order.status === 'Entregado' || order.status === 'Cancelado';

  return (
    <div>
      <Header title={`Pedido ${order.orderNumber}`} />
      <div className="p-6 space-y-5 max-w-5xl">

        {/* Volver */}
        <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft size={15} /> Volver a pedidos
        </Link>

        {/* Header del pedido */}
        <div className="card p-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono font-bold text-xl text-slate-800">{order.orderNumber}</span>
              <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-semibold', STATUS_BADGE[order.status])}>
                {order.status}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Creado el {format(new Date(order.createdAt), "d 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}
            </p>
            {order.scheduledDeliveryDate && (
              <p className="text-sm text-slate-500 mt-0.5">
                Entrega programada: {format(new Date(order.scheduledDeliveryDate), "d 'de' MMMM yyyy", { locale: es })}
              </p>
            )}
          </div>

          {/* Acciones de estado */}
          <div className="flex items-center gap-2">
            {nextStep && (
              <button
                onClick={() => updateStatus.mutate({ status: nextStep.next })}
                disabled={updateStatus.isPending}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60',
                  nextStep.color,
                )}
              >
                <CheckCircle size={15} />
                {updateStatus.isPending ? 'Guardando...' : nextStep.label}
              </button>
            )}
            {!isFinal && (
              <button
                onClick={() => setCancelModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <XCircle size={15} />
                Cancelar
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Columna izquierda: Items + Timeline */}
          <div className="md:col-span-2 space-y-5">

            {/* Items */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <Package size={15} className="text-slate-400" />
                <h2 className="font-medium text-slate-700 text-sm">Productos</h2>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-2.5 font-medium text-slate-500 text-xs">Producto</th>
                    <th className="text-center px-3 py-2.5 font-medium text-slate-500 text-xs">Cant.</th>
                    <th className="text-right px-3 py-2.5 font-medium text-slate-500 text-xs">P. Unit.</th>
                    <th className="text-right px-5 py-2.5 font-medium text-slate-500 text-xs">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {order.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-800">{item.productName}</p>
                        {item.productSku && <p className="text-xs text-slate-400 font-mono">{item.productSku}</p>}
                        {item.discountPercent > 0 && (
                          <span className="text-xs text-green-600">-{item.discountPercent}% dto</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-slate-600">{item.quantity}</td>
                      <td className="px-3 py-3 text-right text-slate-600">{formatARS(item.unitPrice)}</td>
                      <td className="px-5 py-3 text-right font-medium text-slate-800">{formatARS(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200">
                  <tr>
                    <td colSpan={3} className="px-5 py-3 text-right font-semibold text-slate-700">Total</td>
                    <td className="px-5 py-3 text-right font-bold text-lg text-slate-900">{formatARS(order.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Chat / Timeline */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <h2 className="font-medium text-slate-700 text-sm">Mensajes y actividad</h2>
              </div>

              {/* Timeline de mensajes */}
              <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto">
                {order.messages.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">Sin actividad aún.</p>
                )}
                {order.messages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={clsx(
                      'flex gap-2',
                      msg.sender === 'system' ? 'justify-center' : msg.sender === 'company' ? 'justify-end' : 'justify-start',
                    )}
                  >
                    {msg.sender === 'system' ? (
                      <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1 text-xs text-slate-500">
                        <AlertCircle size={11} />
                        {msg.content}
                        <span className="text-slate-400">· {format(new Date(msg.createdAt), 'HH:mm')}</span>
                      </div>
                    ) : (
                      <div className={clsx(
                        'max-w-xs rounded-2xl px-3.5 py-2.5 text-sm',
                        msg.sender === 'company'
                          ? 'bg-orange-500 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm',
                      )}>
                        <p>{msg.content}</p>
                        <p className={clsx('text-xs mt-1', msg.sender === 'company' ? 'text-orange-100' : 'text-slate-400')}>
                          {msg.senderName} · {format(new Date(msg.createdAt), 'HH:mm')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Respuestas rápidas */}
              {!isFinal && (
                <div className="px-5 pb-3">
                  <p className="text-xs text-slate-400 mb-2">Respuestas rápidas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_MESSAGES.map((qm) => (
                      <button
                        key={qm}
                        onClick={() => sendMessage.mutate(qm)}
                        disabled={sendMessage.isPending}
                        className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-600 transition-colors border border-slate-200"
                      >
                        {qm.length > 40 ? qm.slice(0, 40) + '…' : qm}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input de mensaje */}
              {!isFinal && (
                <div className="px-5 pb-4 flex gap-2">
                  <input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && messageText.trim()) sendMessage.mutate(messageText.trim()); }}
                    placeholder="Escribí un mensaje al comprador..."
                    className="input flex-1 text-sm"
                  />
                  <button
                    onClick={() => { if (messageText.trim()) sendMessage.mutate(messageText.trim()); }}
                    disabled={!messageText.trim() || sendMessage.isPending}
                    className="btn-primary px-3 disabled:opacity-40"
                  >
                    <Send size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha: Info comprador + entrega */}
          <div className="space-y-4">

            {/* Comprador */}
            <div className="card p-4">
              <h3 className="font-medium text-slate-700 text-sm mb-3">Comprador</h3>
              <div className="space-y-2">
                <p className="font-medium text-slate-800">{order.buyerName ?? '—'}</p>
                {order.buyerEmail && (
                  <a href={`mailto:${order.buyerEmail}`} className="flex items-center gap-2 text-sm text-slate-500 hover:text-orange-500 transition-colors">
                    <Mail size={13} /> {order.buyerEmail}
                  </a>
                )}
                {order.buyerPhone && (
                  <a href={`tel:${order.buyerPhone}`} className="flex items-center gap-2 text-sm text-slate-500 hover:text-orange-500 transition-colors">
                    <Phone size={13} /> {order.buyerPhone}
                  </a>
                )}
              </div>
            </div>

            {/* Dirección de entrega */}
            {order.deliveryAddress && (
              <div className="card p-4">
                <h3 className="font-medium text-slate-700 text-sm mb-3 flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" /> Entrega
                </h3>
                <div className="text-sm text-slate-600 space-y-0.5">
                  <p>{order.deliveryAddress.street}</p>
                  <p>{order.deliveryAddress.city}, {order.deliveryAddress.province}</p>
                  {order.deliveryAddress.postalCode && <p>CP {order.deliveryAddress.postalCode}</p>}
                  {order.deliveryAddress.notes && (
                    <p className="text-slate-400 italic mt-1">{order.deliveryAddress.notes}</p>
                  )}
                </div>
              </div>
            )}

            {/* Notas */}
            {order.notes && (
              <div className="card p-4">
                <h3 className="font-medium text-slate-700 text-sm mb-2">Notas del pedido</h3>
                <p className="text-sm text-slate-500 italic">{order.notes}</p>
              </div>
            )}

            {/* Motivo de cancelación */}
            {order.rejectionReason && (
              <div className="card p-4 border-red-100 bg-red-50">
                <h3 className="font-medium text-red-700 text-sm mb-2 flex items-center gap-2">
                  <XCircle size={14} /> Motivo de cancelación
                </h3>
                <p className="text-sm text-red-600">{order.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal cancelación */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-semibold text-slate-800 mb-2">Cancelar pedido</h3>
            <p className="text-sm text-slate-500 mb-4">Indicá el motivo de cancelación (obligatorio).</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="input w-full text-sm h-24 resize-none mb-4"
              placeholder="Ej: Stock insuficiente, fuera de zona de entrega..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setCancelModal(false); setCancelReason(''); }}
                className="flex-1 btn-secondary text-sm py-2"
              >
                Volver
              </button>
              <button
                onClick={() => updateStatus.mutate({ status: 'Cancelado', rejectionReason: cancelReason })}
                disabled={!cancelReason.trim() || updateStatus.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {updateStatus.isPending ? '...' : 'Cancelar pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
