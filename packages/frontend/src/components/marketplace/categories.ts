export const CATEGORIES = [
  { key: '', label: 'Todo', emoji: '🏗️' },
  { key: 'Cemento', label: 'Cemento', emoji: '🪨' },
  { key: 'Pisos', label: 'Pisos', emoji: '🟫' },
  { key: 'Pintura', label: 'Pintura', emoji: '🎨' },
  { key: 'Herramientas', label: 'Herramientas', emoji: '🔨' },
  { key: 'Plomería', label: 'Plomería', emoji: '🚿' },
  { key: 'Electricidad', label: 'Electricidad', emoji: '⚡' },
  { key: 'Madera', label: 'Madera', emoji: '🪵' },
  { key: 'Hierro', label: 'Hierro y Acero', emoji: '⚙️' },
  { key: 'Ladrillos', label: 'Ladrillos', emoji: '🧱' },
  { key: 'Techos', label: 'Techos', emoji: '🏠' },
  { key: 'Ferretería', label: 'Ferretería', emoji: '🔩' },
];

export const CATEGORY_GRADIENTS: Record<string, string> = {
  Cemento: 'from-stone-100 to-stone-200',
  Pisos: 'from-amber-50 to-amber-100',
  Pintura: 'from-blue-50 to-indigo-100',
  Herramientas: 'from-orange-50 to-orange-100',
  'Plomería': 'from-cyan-50 to-cyan-100',
  Electricidad: 'from-yellow-50 to-yellow-100',
  Madera: 'from-orange-50 to-amber-100',
  Hierro: 'from-slate-100 to-slate-200',
  Ladrillos: 'from-red-50 to-red-100',
  Techos: 'from-teal-50 to-teal-100',
  'Ferretería': 'from-zinc-50 to-zinc-100',
  default: 'from-slate-50 to-slate-100',
};
