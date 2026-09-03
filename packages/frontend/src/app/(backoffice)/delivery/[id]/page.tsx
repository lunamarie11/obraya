'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { api, formatARS } from '@/lib/api';
import {
  ArrowLeft, MapPin, Package, Phone, User, Clock,
  CheckCircle2, Truck, Navigation, AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';

const COMMISSION = 0.08;
const earn = (cents: number) => Math.round(Number(cents) * COMMISSION);

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Despachado: { label: 'Listo para retirar', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  Entregado:  { label: 'Entregado',           color: 'text-green-600',  bg: 'bg-green-50 border-green-200'  },
};

const TIMELINE = [
  { label: 'Pedido creado',   status: 'Nuevo',       icon: <Package size={14} /> },
  { label: 'Confirmado',      status: 'Aceptado',    icon: <CheckCircle2 size={14} /> },
  { label: 'En preparación',  status: 'Preparacion', icon: <Clock size={14} /> },
  { label: 'Listo para pick', status: 'Despachado',  icon: <Truck size={14} /> },
  { label: 'Entregado',       status: 'Entregado',   icon: <CheckCircle2 size={14} /> },
];

const STATUS_ORDER = ['Nuevo','Aceptado','Preparacion','Despachado','Entregado'];

export default function DeliveryOrderDetail() {
  const params = useParams() ?? {};
  const id = (params.id ?? '') as string;
  const router = useRouter();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => api.get(`/orders/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const markDelivered = useMutation({
    mutationFn: () => api.put(`/orders/${id}/status`, { status: 'Entregado' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order-detail', id] });
      qc.invalidateQueries({ queryKey: ['delivery-pending'] });
      qc.invalidateQueries({ queryKey: ['delivery-history'] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 p-6">
        <AlertTriangle size={32} className="text-slate-400" />
        <p className="text-slate-600 font-medium">Pedido no encontrado</p>
        <button onClick={() => router.back()} className="text-orange-500 text-sm font-medium">
          ← Volver
        </button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' };
  const currentStatusIdx = STATUS_ORDER.indexOf(order.status);
  const earnings = earn(order.totalAmount);
  const isDeliverable = order.status === 'Despachado';
  const isDelivered = order.status === 'Entregado';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 sticky top-0 z-10 gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <p className="text-slate-900 font-bold text-sm leading-tight">{order.orderNumber}</p>
          <p className="text-slate-500 text-xs">{order.buyerName}</p>
        </div>
        <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full border', statusCfg.bg, statusCfg.color)}>
          {statusCfg.label}
        </span>
      </header>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">

        {/* Ganancia */}
        <div className={clsx(
          'rounded-2xl p-4 flex items-center justify-between',
          isDelivered ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200',
        )}>
          <div>
            <p className="text-xs text-slate-500">Tu ganancia</p>
            <p className={clsx('text-2xl font-extrabold', isDelivered ? 'text-green-600' : 'text-orange-500')}>
              {formatARS(earnings)}
            </p>
            <p className="text-xs text-slate-500">{((COMMISSION)*100).toFixed(0)}% de {formatARS(order.totalAmount)}</p>
          </div>
          <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center', isDelivered ? 'bg-green-100' : 'bg-orange-100')}>
            {isDelivered ? <CheckCircle2 size={28} className="text-green-600" /> : <Truck size={28} className="text-orange-500" />}
          </div>
        </div>

        {/* Ruta */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ruta</h3>
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1 shrink-0 mt-1">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <div className="w-0.5 h-8 border-l border-dashed border-slate-300" />
              <div className="w-3 h-3 rounded-full bg-green-600" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-xs text-slate-500">Retirá en</p>
                <p className="text-slate-900 font-semibold text-sm">Ferretería ObraYa Demo</p>
                <p className="text-slate-500 text-xs">Av. Corrientes 1234, CABA</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Entregá en</p>
                <p className="text-slate-900 font-semibold text-sm">{order.buyerName}</p>
                <p className="text-slate-500 text-xs">
                  {order.deliveryAddress?.street && `${order.deliveryAddress.street}, `}
                  {order.deliveryAddress?.city}
                  {order.deliveryAddress?.province && `, ${order.deliveryAddress.province}`}
                </p>
              </div>
            </div>
            <button className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors shrink-0">
              <Navigation size={18} />
            </button>
          </div>
        </div>

        {/* Contacto */}
        {(order.buyerName || order.buyerPhone) && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Contacto</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <User size={18} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-slate-900 font-semibold text-sm">{order.buyerName}</p>
                  <p className="text-slate-500 text-xs">{order.buyerPhone ?? 'Sin teléfono'}</p>
                </div>
              </div>
              {order.buyerPhone && (
                <a
                  href={`tel:${order.buyerPhone}`}
                  className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center"
                >
                  <Phone size={18} className="text-green-600" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Items */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Productos ({order.items?.length ?? 0})
          </h3>
          <div className="space-y-2">
            {(order.items ?? []).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 text-sm font-medium truncate">{item.productName}</p>
                  <p className="text-slate-500 text-xs">× {item.quantity} · {formatARS(item.unitPrice)} c/u</p>
                </div>
                <p className="text-slate-700 text-sm font-semibold ml-3 shrink-0">{formatARS(item.subtotal)}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-2 mt-1">
            <span className="text-slate-500 font-semibold text-sm">Total</span>
            <span className="text-slate-900 font-extrabold text-sm">{formatARS(order.totalAmount)}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Estado</h3>
          <div className="space-y-3">
            {TIMELINE.map((step, i) => {
              const done = i <= currentStatusIdx;
              const active = i === currentStatusIdx;
              return (
                <div key={step.status} className="flex items-center gap-3">
                  <div className={clsx(
                    'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs',
                    done
                      ? active ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                      : 'bg-slate-200 text-slate-400',
                  )}>
                    {step.icon}
                  </div>
                  <span className={clsx('text-sm font-medium', done ? 'text-slate-900' : 'text-slate-400')}>
                    {step.label}
                  </span>
                  {active && <span className="ml-auto text-xs text-orange-500 font-semibold animate-pulse">Actual</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        {isDeliverable && (
          <button
            onClick={() => markDelivered.mutate()}
            disabled={markDelivered.isPending}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-2xl text-base transition-colors shadow-lg shadow-orange-500/20"
          >
            {markDelivered.isPending ? 'Confirmando...' : '✓ Confirmar entrega'}
          </button>
        )}

        {isDelivered && order.actualDeliveryDate && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <CheckCircle2 size={24} className="text-green-600 mx-auto mb-2" />
            <p className="text-green-600 font-semibold">Entregado</p>
            <p className="text-slate-500 text-xs mt-1">
              {format(new Date(order.actualDeliveryDate), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
            </p>
          </div>
        )}

        {/* Info creación */}
        <p className="text-center text-slate-400 text-xs pb-2">
          Pedido creado {order.createdAt
            ? format(new Date(order.createdAt), "d 'de' MMMM 'a las' HH:mm", { locale: es })
            : '—'}
        </p>
      </div>
    </div>
  );
}
