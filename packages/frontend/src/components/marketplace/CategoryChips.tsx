'use client';

import { clsx } from 'clsx';
import { CATEGORIES } from './categories';

interface Props {
  value: string;
  onChange: (key: string) => void;
  className?: string;
}

export function CategoryChips({ value, onChange, className }: Props) {
  return (
    <div className={clsx('overflow-x-auto scrollbar-hide', className)}>
      <div className="flex items-center gap-2 px-4 sm:px-6 py-3 w-max">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onChange(cat.key)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all btn-ios',
              value === cat.key
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            <span className="text-base leading-none">{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
