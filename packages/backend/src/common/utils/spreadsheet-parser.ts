import { BadRequestException } from '@nestjs/common';
import { parse as csvParse } from 'csv-parse/sync';
// El tsconfig de este proyecto tiene esModuleInterop:false, asi que un
// default import de exceljs (modulo CJS sin ".default") queda undefined en
// runtime - hay que importarlo como namespace.
import * as ExcelJS from 'exceljs';

// Parser unico para los imports masivos (productos, stock): acepta CSV y
// Excel (.xlsx/.xls) y devuelve siempre el mismo shape (array de objetos
// con claves normalizadas en minuscula), para que los services no necesiten
// saber de donde vino el archivo. Usamos exceljs en vez de "xlsx" (SheetJS)
// porque esa libreria tiene vulnerabilidades altas sin parche (prototype
// pollution + ReDoS) y procesamos archivos subidos por usuarios externos.

// Clientes reales suben planillas con encabezados en espanol (toda la app y
// la base de clientes es hispanohablante), pero ProductsService/StockService
// esperan las claves en ingles (name, sku, unit_of_measure, etc. - ver
// importFromFile/bulkUpdateFromCsv). En vez de tocar esos dos services,
// se traduce el alias aca mismo, en el unico punto donde se normalizan
// headers, para que ambos importers lo hereden gratis.
const SPANISH_HEADER_ALIASES: Record<string, string> = {
  nombre: 'name',
  // Bug #3 (QA 18/11): planillas reales usan "Producto" y "Precio Lista".
  producto: 'name',
  'nombre del producto': 'name',
  'nombre producto': 'name',
  articulo: 'name',
  codigo: 'sku',
  cod: 'sku',
  'codigo sku': 'sku',
  'precio lista': 'price',
  'precio de lista': 'price',
  'precio final': 'price',
  'precio unitario': 'price',
  'precio con iva': 'price',
  existencia: 'quantity',
  unidades: 'quantity',
  'codigo de producto': 'sku',
  descripcion: 'description',
  categoria: 'category',
  subcategoria: 'subcategory',
  marca: 'brand',
  unidad: 'unit_of_measure',
  'unidad de medida': 'unit_of_measure',
  precio: 'price',
  cantidad: 'quantity',
  'id de producto': 'product_id',
  'id del producto': 'product_id',
  'codigo de producto id': 'product_id',
  deposito: 'warehouse_id',
  'id de deposito': 'warehouse_id',
  'id del deposito': 'warehouse_id',
  notas: 'notes',
  nota: 'notes',
};

// Quita tildes/diacriticos para que "Código" y "codigo" matcheen el mismo
// alias (los clientes no siempre tipean los acentos correctamente).
function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Forma canonica usada solo para buscar en el diccionario de alias: sin
// acentos, guiones bajos como espacios, espacios colapsados. La clave final
// devuelta sigue siendo la normalizedKey original si no hay alias (asi no
// se rompe nada para los headers en ingles que ya funcionaban).
function resolveHeaderKey(normalizedKey: string): string {
  const canonical = stripAccents(normalizedKey).replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return SPANISH_HEADER_ALIASES[canonical] ?? normalizedKey;
}

// Excel en español (es-AR) exporta CSV con ";" como separador, y ahí la coma
// es el separador decimal ("1500,50"). No se pueden aceptar ambos a la vez:
// se decide mirando el encabezado (primera línea).
function detectCsvDelimiter(buffer: Buffer): string {
  const firstLine = buffer.toString('utf-8').split(/\r?\n/, 1)[0] ?? '';
  const count = (ch: string) => firstLine.split(ch).length - 1;
  return count(';') > count(',') ? ';' : ',';
}

export async function parseSpreadsheet(
  buffer: Buffer,
  originalName?: string,
): Promise<Record<string, string>[]> {
  const isCsv = (originalName ?? '').toLowerCase().endsWith('.csv');

  let rawRows: Record<string, unknown>[];

  if (isCsv) {
    try {
      rawRows = csvParse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        delimiter: detectCsvDelimiter(buffer),
      });
    } catch {
      throw new BadRequestException('El archivo CSV tiene formato inválido');
    }
  } else {
    try {
      const workbook = new ExcelJS.Workbook();
      // exceljs declara su propio tipo global `Buffer extends ArrayBuffer`
      // que choca con el Buffer de Node (Uint8Array) - cast necesario, el
      // runtime acepta un Buffer de Node sin problema.
      await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
      const sheet = workbook.worksheets[0];
      if (!sheet) throw new Error('El archivo no tiene hojas');

      const headerRow = sheet.getRow(1);
      const headers: string[] = [];
      headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber] = String(cell.value ?? '').trim();
      });

      rawRows = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // header
        const obj: Record<string, unknown> = {};
        let hasValue = false;
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers[colNumber];
          if (!header) return;
          const value = cell.value;
          if (value !== null && value !== undefined && value !== '') hasValue = true;
          obj[header] = value;
        });
        if (hasValue) rawRows.push(obj);
      });
    } catch {
      throw new BadRequestException(
        'El archivo no se pudo leer. Verificá que sea un Excel (.xlsx) o CSV válido',
      );
    }
  }

  return rawRows.map((row) => {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = resolveHeaderKey(key.trim().toLowerCase());
      if (value === null || value === undefined) {
        normalized[normalizedKey] = '';
      } else if (typeof value === 'object' && 'result' in (value as any)) {
        // Celdas con formula: exceljs devuelve { formula, result }
        normalized[normalizedKey] = String((value as any).result ?? '').trim();
      } else {
        normalized[normalizedKey] = String(value).trim();
      }
    }
    return normalized;
  });
}
