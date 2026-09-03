// Tokens de diseño replicados de packages/frontend/src/app/globals.css
// (--color-primary, .card-ios, .btn-ios) para mantener la misma identidad visual
// sin depender de Tailwind/NativeWind en este pase (ver ADR-005).
export const colors = {
  primary: '#f97316',
  primaryDark: '#ea580c',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  white: '#ffffff',
  green500: '#22c55e',
  green600: '#16a34a',
  red500: '#ef4444',
  blue600: '#2563eb',
  amber600: '#d97706',
  indigo600: '#4f46e5',
  purple600: '#9333ea',
} as const;

export const radius = {
  card: 20, // equivalente a .card-ios
  pill: 999, // equivalente a .btn-ios / botones redondeados
  sm: 12,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// Mismo mapeo de color que .badge-* en globals.css, por estado de pedido.
export const statusColors: Record<string, { bg: string; text: string }> = {
  Nuevo: { bg: '#eff6ff', text: colors.blue600 },
  Aceptado: { bg: '#eef2ff', text: colors.indigo600 },
  Preparacion: { bg: '#fffbeb', text: colors.amber600 },
  Despachado: { bg: '#faf5ff', text: colors.purple600 },
  Entregado: { bg: '#f0fdf4', text: colors.green600 },
  Cancelado: { bg: '#fef2f2', text: colors.red500 },
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;
