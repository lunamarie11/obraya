// Plantillas descargables para los importadores (bugs #3 y #4, QA 18/11).
// Separador ";" + BOM para que Excel en español la abra en columnas y con
// tildes correctas. El backend acepta "," y ";" (ver spreadsheet-parser.ts).
export function downloadCsvTemplate(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = [headers, ...rows].map((r) => r.map(escape).join(';')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const PRODUCTS_TEMPLATE = {
  filename: 'plantilla-productos-obraya.csv',
  headers: ['Nombre', 'SKU', 'Descripción', 'Categoría', 'Marca', 'Unidad de medida', 'Precio', 'Stock'],
  rows: [
    ['Yeso x 1 KG', 'YES1', 'Yeso de construcción', 'Materiales', '', 'kg', '1500,00', '100'],
    ['Pastina Blanca x 1 KG', 'PB1', '', 'Terminaciones', '', 'kg', '2300,50', '50'],
  ],
};

export const STOCK_TEMPLATE = {
  filename: 'plantilla-stock-obraya.csv',
  headers: ['SKU', 'Cantidad'],
  rows: [
    ['YES1', '100'],
    ['PB1', '50'],
  ],
};

export function apiErrorMessage(err: any, fallback: string): string {
  const msg = err?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join('. ');
  return typeof msg === 'string' ? msg : fallback;
}
