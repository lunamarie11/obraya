'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { Truck, MapPin } from 'lucide-react';
import type { DriverMapPoint } from '@/components/DriverMap';

// Ver ADR-018: Leaflet necesita `window`, no se puede renderizar en el
// servidor. Se carga dinámicamente con ssr:false.
const DriverMap = dynamic(() => import('@/components/DriverMap').then((m) => m.DriverMap), { ssr: false });

export default function DeliveryMapPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !['Admin', 'Logistica'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }
    setAllowed(true);
  }, [router]);

  const { data, isLoading } = useQuery({
    queryKey: ['logistics-locations'],
    queryFn: () => api.get('/logistics/locations').then((r) => r.data as DriverMapPoint[]),
    refetchInterval: 15_000,
    enabled: allowed === true,
  });

  if (allowed !== true) return null;

  const points = data ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-5 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
            <Truck size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-900">Repartidores en ruta</span>
        </div>
        {isLoading && <span className="text-xs text-slate-400 animate-pulse">Actualizando...</span>}
      </header>

      <div className="p-4 max-w-5xl mx-auto space-y-4">
        <p className="text-sm text-slate-500">
          {points.length === 0
            ? 'Sin repartidores en ruta en este momento.'
            : `${points.length} repartidor${points.length !== 1 ? 'es' : ''} en ruta.`}
        </p>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" style={{ height: '70vh' }}>
          {points.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <MapPin size={32} className="text-slate-300 mb-3" />
              <p className="text-slate-600 font-medium">Sin repartidores en ruta</p>
              <p className="text-slate-500 text-sm mt-1">
                Van a aparecer acá apenas un repartidor tome un pedido y comparta su ubicación.
              </p>
            </div>
          ) : (
            <DriverMap points={points} />
          )}
        </div>
      </div>
    </div>
  );
}
