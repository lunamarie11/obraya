'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, formatARS } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import {
  Truck, MapPin, CheckCircle2, Clock, Package,
  ChevronRight, Zap, DollarSign, Navigation, AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';

// Estado local del flow de entrega (la API solo tiene Despachado → Entregado)
type DeliveryStep = 'available' | 'heading' | 'arrived' | 'picked' | 'delivering' | 'done';

const STEPS: { key: DeliveryStep; label: string; icon: React.ReactNode; cta: string }[] = [
  { key: 'heading',   label: 'Yendo al origen',     icon: <Navigation size={16} />,  cta: 'Llegué al origen' },
  { key: 'arrived',   label: 'En el origen',         icon: <MapPin size={16} />,      cta: 'Tomé el pedido' },
  { key: 'picked',    label: 'Pedido en mano',       icon: <Package size={16} />,     cta: 'Salir a entregar' },
  { key: 'delivering',label: 'En camino al cliente', icon: <Truck size={16} />,       cta: 'Entregué el pedido' },
];

export default function DeliveryPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [deliveryStep, setDeliveryStep] = useState<DeliveryStep>('available');
  const [isOnline, setIsOnline] = useState(true);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user) setCompanyId(user.companyId);
  }, []);

  const { data: company } = useQuery({
    queryKey: ['delivery-company', companyId],
    queryFn: () => api.get(`/companies/${companyId}`).then(r => r.data),
    enabled: !!companyId,
  });
  // Ver ADR-017: reemplaza el COMMISSION = 0.08 hardcodeado.
  const commission = (company?.driverCommissionPercent ?? 8) / 100;
  const earn = (cents: number) => Math.round(Number(cents) * commission);

  // Disponibles: Despachado y sin repartidor asignado (ver ADR-017).
  const { data: availableData, isLoading } = useQuery({
    queryKey: ['delivery-available'],
    queryFn: () => api.get('/orders', { params: { status: 'Despachado', unassigned: true, limit: 50 } }).then(r => r.data),
    refetchInterval: 30_000,
    enabled: isOnline,
  });

  // Mis pedidos: Despachado y asignados a mí.
  const { data: mineData } = useQuery({
    queryKey: ['delivery-mine'],
    queryFn: () => api.get('/orders', { params: { status: 'Despachado', assignedToMe: true, limit: 50 } }).then(r => r.data),
    refetchInterval: 30_000,
    enabled: isOnline,
  });

  const { data: historyData } = useQuery({
    queryKey: ['delivery-history'],
    queryFn: () => api.get('/orders', { params: { status: 'Entregado', limit: 200 } }).then(r => r.data),
  });

  const claimOrder = useMutation({
    mutationFn: (id: string) => api.post(`/orders/${id}/claim`),
    onSuccess: () => {
      setClaimError(null);
      setDeliveryStep('heading');
      qc.invalidateQueries({ queryKey: ['delivery-available'] });
      qc.invalidateQueries({ queryKey: ['delivery-mine'] });
    },
    onError: (err: any) => {
      setClaimError(err?.response?.data?.message ?? 'Este pedido ya fue tomado por otro repartidor');
      qc.invalidateQueries({ queryKey: ['delivery-available'] });
    },
  });

  const markDelivered = useMutation({
    mutationFn: (id: string) => api.put(`/orders/${id}/status`, { status: 'Entregado' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery-available'] });
      qc.invalidateQueries({ queryKey: ['delivery-mine'] });
      qc.invalidateQueries({ queryKey: ['delivery-history'] });
      setDeliveryStep('available');
    },
  });

  const availableOrders: any[] = availableData?.data ?? [];
  const historyOrders: any[] = historyData?.data ?? [];
  const activeOrder = mineData?.data?.[0] ?? null;

  // Si ya tengo un pedido asignado (ej. al recargar la página), arranco el
  // timeline cosmético en "heading" en vez de "available".
  useEffect(() => {
    if (activeOrder && deliveryStep === 'available') setDeliveryStep('heading');
    if (!activeOrder && deliveryStep !== 'available') setDeliveryStep('available');
  }, [activeOrder, deliveryStep]);

  // Ver ADR-018: mientras hay un pedido activo asignado, reporto mi posición
  // con la Geolocation API del navegador (throttle de ~15s entre envíos).
  // Best-effort: si el permiso se niega o falla, no bloquea el resto del flujo.
  const lastSentAtRef = useRef(0);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!activeOrder || typeof navigator === 'undefined' || !navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastSentAtRef.current < 15_000) return;
        lastSentAtRef.current = now;

        api.put('/logistics/location', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          recordedAt: new Date(position.timestamp).toISOString(),
        }).catch(() => {});
      },
      () => {
        // Permiso denegado o error de geolocalización: no se manda nada.
      },
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    };
  }, [activeOrder?.id]);

  const todayStr = new Date().toDateString();
  const todayDeliveries = historyOrders.filter(o =>
    o.actualDeliveryDate && new Date(o.actualDeliveryDate).toDateString() === todayStr,
  );
  const todayEarnings = todayDeliveries.reduce((s, o) => s + earn(o.totalAmount), 0);
  const weekEarnings = historyOrders.slice(0, 20).reduce((s, o) => s + earn(o.totalAmount), 0);

  function handleStepCta() {
    if (deliveryStep === 'heading')    setDeliveryStep('arrived');
    else if (deliveryStep === 'arrived')    setDeliveryStep('picked');
    else if (deliveryStep === 'picked')     setDeliveryStep('delivering');
    else if (deliveryStep === 'delivering') {
      if (activeOrder) markDelivered.mutate(activeOrder.id);
    }
  }

  function takeOrder(order: any) {
    claimOrder.mutate(order.id);
  }

  const currentStepIndex = STEPS.findIndex(s => s.key === deliveryStep);
  const currentStepInfo = STEPS[currentStepIndex];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-5 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
            <Truck size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-900">Mis Entregas</span>
        </div>
        {/* Online toggle */}
        <button
          onClick={() => setIsOnline(v => !v)}
          className={clsx(
            'flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all',
            isOnline
              ? 'bg-green-50 text-green-600 border border-green-200'
              : 'bg-slate-100 text-slate-500 border border-slate-300',
          )}
        >
          <span className={clsx('w-2 h-2 rounded-full', isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400')} />
          {isOnline ? 'En línea' : 'Sin conexión'}
        </button>
      </header>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Hoy', value: `${todayDeliveries.length} entregas`, icon: <CheckCircle2 size={15} className="text-green-600" />, bg: 'bg-green-50' },
            { label: 'Ganado hoy', value: formatARS(todayEarnings), icon: <DollarSign size={15} className="text-orange-500" />, bg: 'bg-orange-50' },
            { label: 'Esta semana', value: formatARS(weekEarnings), icon: <Zap size={15} className="text-purple-600" />, bg: 'bg-purple-50' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm">
              <div className={clsx('w-7 h-7 rounded-xl flex items-center justify-center mb-2', s.bg)}>{s.icon}</div>
              <p className="text-slate-900 font-bold text-sm leading-tight">{s.value}</p>
              <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {claimError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle size={16} />
            {claimError}
          </div>
        )}

        {/* Entrega activa */}
        {activeOrder && (
          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Entrega activa</h2>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl overflow-hidden">
              {/* Progress steps */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-orange-200">
                {STEPS.map((step, i) => (
                  <div key={step.key} className="flex items-center gap-1.5">
                    <div className={clsx(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all',
                      i < currentStepIndex
                        ? 'bg-green-500 text-white'
                        : i === currentStepIndex
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                        : 'bg-slate-200 text-slate-400',
                    )}>
                      {i < currentStepIndex ? <CheckCircle2 size={14} /> : step.icon}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={clsx('h-0.5 w-6', i < currentStepIndex ? 'bg-green-500' : 'bg-slate-300')} />
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 space-y-3">
                {/* Status label */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500">{currentStepInfo?.icon}</span>
                    <span className="text-orange-600 font-semibold text-sm">{currentStepInfo?.label}</span>
                  </div>
                  <span className="text-slate-500 text-xs font-mono">{activeOrder.orderNumber}</span>
                </div>

                {/* Addresses */}
                <div className="space-y-2 bg-white border border-slate-200 rounded-xl p-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Package size={11} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Retirá en</p>
                      <p className="text-sm text-slate-900 font-medium">Ferretería ObraYa Demo</p>
                      <p className="text-xs text-slate-500">Av. Corrientes 1234, CABA</p>
                    </div>
                  </div>
                  <div className="border-l-2 border-dashed border-slate-300 h-4 ml-2.5" />
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={11} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Entregá en</p>
                      <p className="text-sm text-slate-900 font-medium">{activeOrder.buyerName}</p>
                      <p className="text-xs text-slate-500">{activeOrder.deliveryAddress?.street}, {activeOrder.deliveryAddress?.city}</p>
                    </div>
                  </div>
                </div>

                {/* Items summary */}
                <div className="text-xs text-slate-500">
                  {activeOrder.items?.length} ítem{activeOrder.items?.length !== 1 ? 's' : ''} · {formatARS(activeOrder.totalAmount)}
                  <span className="ml-2 text-green-600 font-semibold">+{formatARS(earn(activeOrder.totalAmount))} para vos</span>
                </div>

                {/* CTA */}
                <button
                  onClick={handleStepCta}
                  disabled={markDelivered.isPending}
                  className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-xl transition-colors text-sm"
                >
                  {markDelivered.isPending ? 'Confirmando...' : currentStepInfo?.cta}
                </button>

                {/* Ver detalle */}
                <button
                  onClick={() => router.push(`/delivery/${activeOrder.id}`)}
                  className="w-full py-2.5 text-slate-500 text-xs font-medium hover:text-slate-900 transition-colors flex items-center justify-center gap-1"
                >
                  Ver detalle completo <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Sin conexión */}
        {!isOnline && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm">
            <AlertCircle size={32} className="text-slate-400 mx-auto mb-2" />
            <p className="text-slate-700 font-medium">Sin conexión</p>
            <p className="text-slate-500 text-sm mt-1">Activá tu estado para ver pedidos disponibles.</p>
          </div>
        )}

        {/* Pedidos disponibles */}
        {isOnline && !activeOrder && (
          <section>
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Pedidos disponibles
              </h2>
              {isLoading && <span className="text-xs text-slate-400 animate-pulse">Actualizando...</span>}
            </div>

            {availableOrders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                <Clock size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Sin pedidos disponibles</p>
                <p className="text-slate-500 text-sm mt-1">Los pedidos nuevos aparecerán acá automáticamente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableOrders.map((order: any) => (
                  <OrderCard key={order.id} order={order} earn={earn} onTake={() => takeOrder(order)} taking={claimOrder.isPending} />
                ))}
              </div>
            )}
          </section>
        )}

        {isOnline && activeOrder && availableOrders.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
              Más pedidos ({availableOrders.length})
            </h2>
            <p className="text-xs text-slate-500 text-center py-4">Terminá la entrega actual primero.</p>
          </section>
        )}

      </div>
    </div>
  );
}

function OrderCard({ order, earn, onTake, taking }: { order: any; earn: (cents: number) => number; onTake: () => void; taking: boolean }) {
  const earnings = earn(order.totalAmount);
  const itemCount = order.items?.length ?? 0;
  const createdAt = order.createdAt ? new Date(order.createdAt) : null;

  return (
    <div className="bg-white border border-slate-200 hover:border-orange-300 rounded-2xl overflow-hidden transition-all shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-xs font-mono text-slate-500">{order.orderNumber}</span>
            <p className="text-slate-900 font-semibold text-sm mt-0.5">{order.buyerName}</p>
          </div>
          <div className="text-right">
            <p className="text-green-600 font-extrabold text-lg">+{formatARS(earnings)}</p>
            <p className="text-slate-500 text-xs">tu ganancia</p>
          </div>
        </div>

        {/* Addresses */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0 ml-0.5" />
            <p className="text-xs text-slate-500">Retirá en <span className="text-slate-700 font-medium">Ferretería ObraYa</span></p>
          </div>
          <div className="border-l border-dashed border-slate-300 h-3 ml-1.5" />
          <div className="flex items-center gap-2.5">
            <MapPin size={14} className="text-green-600 shrink-0" />
            <p className="text-xs text-slate-500 truncate">
              {order.deliveryAddress?.street}, <span className="text-slate-700 font-medium">{order.deliveryAddress?.city}</span>
            </p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
          <span>{itemCount} ítem{itemCount !== 1 ? 's' : ''} · {formatARS(order.totalAmount)}</span>
          {createdAt && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {format(createdAt, "HH:mm", { locale: es })}
            </span>
          )}
        </div>

        <button
          onClick={onTake}
          disabled={taking}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-colors"
        >
          {taking ? 'Tomando...' : 'Tomar pedido'}
        </button>
      </div>
    </div>
  );
}
