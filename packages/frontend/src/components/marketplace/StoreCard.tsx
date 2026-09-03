'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { Star, Clock, Heart } from 'lucide-react';
import type { PublicCompany } from '@obraya/shared';
import { useFavorites } from '@/hooks/useFavorites';

// Rating y ETA todavía no existen como datos reales en el backend (ver
// docs/adrs/ADR-003-endpoint-publico-marketplace.md). Se derivan de forma
// estable a partir del id/coverageZones para que la UI no salte entre
// valores random en cada render, pero son placeholders explícitos hasta
// que exista un modelo real de reviews/logística.
function placeholderRating(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return (4 + (hash % 10) / 10).toFixed(1);
}

function placeholderEta(coverageZones?: string[]): string {
  const zones = coverageZones?.length ?? 0;
  if (zones >= 5) return '30-45 min';
  if (zones >= 1) return '45-60 min';
  return '60-90 min';
}

export function StoreCard({ company }: { company: PublicCompany }) {
  const router = useRouter();
  const { buyer, isFavorite, toggle } = useFavorites();
  const favorited = isFavorite('company', company.id);
  const initials = company.razonSocial
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  function handleToggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!buyer) {
      router.push('/account');
      return;
    }
    toggle('company', company.id);
  }

  return (
    <Link href={`/marketplace/${company.id}`} className="group block">
      <div className="card-ios overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 p-4 flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 overflow-hidden">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.razonSocial} className="w-full h-full object-cover" />
          ) : (
            <span className="text-orange-500 font-bold text-lg">{initials}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm text-slate-900 truncate">{company.razonSocial}</h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Star size={12} className="text-amber-400 fill-amber-400" />
              {placeholderRating(company.id)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {placeholderEta(company.coverageZones)}
            </span>
          </div>
          {(company.city || company.province) && (
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {[company.city, company.province].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        <button
          onClick={handleToggleFavorite}
          className={clsx(
            'shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors btn-ios',
            favorited ? 'text-red-500 bg-red-50' : 'text-slate-300 hover:text-red-500 hover:bg-red-50',
          )}
        >
          <Heart size={16} className={favorited ? 'fill-red-500' : ''} />
        </button>
      </div>
    </Link>
  );
}
