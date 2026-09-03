import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import type { OrderStatus } from '@obraya/shared';

// 5 pasos del camino feliz (ver VALID_TRANSITIONS en
// packages/backend/src/modules/orders/entities/order.entity.ts). "Cancelado"
// es una rama terminal desde cualquier estado activo, no un paso más — se
// muestra aparte como un banner distinto.
const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'Nuevo', label: 'Nuevo' },
  { key: 'Aceptado', label: 'Aceptado' },
  { key: 'Preparacion', label: 'Preparación' },
  { key: 'Despachado', label: 'Despachado' },
  { key: 'Entregado', label: 'Entregado' },
];

export function OrderStatusStepper({ status }: { status: OrderStatus }) {
  if (status === 'Cancelado') {
    return (
      <div className="badge-cancelado inline-flex px-4 py-2 text-sm">
        Este pedido fue cancelado
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-start">
      {STEPS.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={s.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  done ? 'bg-green-500 text-white' : active ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-200 text-slate-400',
                )}
              >
                {done ? <Check size={16} /> : i + 1}
              </div>
              <span className={clsx('text-[11px] font-semibold whitespace-nowrap', active ? 'text-orange-500' : done ? 'text-green-600' : 'text-slate-400')}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={clsx('flex-1 h-0.5 mx-1.5 mb-4 transition-colors', done ? 'bg-green-500' : 'bg-slate-200')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
