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
export async function parseSpreadsheet(
  buffer: Buffer,
  originalName?: string,
): Promise<Record<string, string>[]> {
  const isCsv = (originalName ?? '').toLowerCase().endsWith('.csv');

  let rawRows: Record<string, unknown>[];

  if (isCsv) {
    try {
      rawRows = csvParse(buffer, { columns: true, skip_empty_lines: true, trim: true });
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
      const normalizedKey = key.trim().toLowerCase();
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
