// Espejo de packages/frontend/src/components/marketplace/categories.ts (sin los
// gradientes Tailwind, que no aplican en RN).
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

// Equivalente sólido de CATEGORY_GRADIENTS del frontend (RN no soporta
// gradientes Tailwind ni CSS; se usa un color de fondo plano por categoría).
export const CATEGORY_COLORS: Record<string, string> = {
  Cemento: '#f5f5f4',
  Pisos: '#fffbeb',
  Pintura: '#eef2ff',
  Herramientas: '#fff7ed',
  'Plomería': '#ecfeff',
  Electricidad: '#fefce8',
  Madera: '#fff7ed',
  Hierro: '#f1f5f9',
  Ladrillos: '#fef2f2',
  Techos: '#f0fdfa',
  'Ferretería': '#fafafa',
  default: '#f8fafc',
};
