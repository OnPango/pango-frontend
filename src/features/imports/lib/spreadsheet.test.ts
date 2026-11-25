import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { autoMap, buildRows } from './movementTemplate';
import {
  columnLetter,
  dataRowCount,
  detectDelimiter,
  headersOf,
  isAcceptedFile,
  parseCsv,
  readSpreadsheet,
  SpreadsheetError,
} from './spreadsheet';

describe('parseCsv', () => {
  it('reads plain rows with LF or CRLF line ends', () => {
    expect(parseCsv('a,b\n1,2\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('keeps separators, quotes and line breaks inside quoted fields', () => {
    expect(parseCsv('name,note\n"Tornillo, M8","dice ""hola""\nadiós"\n')).toEqual([
      ['name', 'note'],
      ['Tornillo, M8', 'dice "hola"\nadiós'],
    ]);
  });

  it('drops a leading BOM and trailing empty lines, and keeps empty cells', () => {
    expect(parseCsv('﻿a,b\n1,\n\n\n')).toEqual([
      ['a', 'b'],
      ['1', ''],
    ]);
  });

  it('reads the last row without a final line break', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('uses the semicolon of Spanish-locale Excel', () => {
    expect(detectDelimiter('fecha;sku;cantidad\n2025-01-01;A,1;3')).toBe(';');
    expect(parseCsv('fecha;cantidad\n2025-01-01;1,5')).toEqual([
      ['fecha', 'cantidad'],
      ['2025-01-01', '1,5'],
    ]);
  });

  it('ignores separators inside quotes when detecting the delimiter', () => {
    expect(detectDelimiter('"a;b;c",d\n')).toBe(',');
    expect(detectDelimiter('a\tb\tc\n')).toBe('\t');
  });
});

describe('headers', () => {
  it('names empty headers after their column letter', () => {
    const sheet = {
      name: 'Hoja1',
      rows: [
        ['Fecha', null, ' SKU '],
        ['2025-01-01', 'x', 'A', 'extra'],
      ],
    };
    expect(headersOf(sheet)).toEqual(['Fecha', 'Columna B', 'SKU', 'Columna D']);
  });

  it('turns indexes into spreadsheet letters', () => {
    expect([0, 25, 26, 27, 701, 702].map(columnLetter)).toEqual([
      'A',
      'Z',
      'AA',
      'AB',
      'ZZ',
      'AAA',
    ]);
  });

  it('counts only data rows that hold something', () => {
    const sheet = { name: 'x', rows: [['a'], ['1'], [''], [null], ['  '], ['2']] };
    expect(dataRowCount(sheet)).toBe(2);
  });
});

describe('readSpreadsheet', () => {
  it('reads a CSV as one sheet', async () => {
    const file = new File(['sku;quantity_out\nPRD-001;3\n'], 'ventas.csv', { type: 'text/csv' });
    const read = await readSpreadsheet(file);
    expect(read.fileName).toBe('ventas.csv');
    expect(read.sheets).toEqual([
      {
        name: 'ventas.csv',
        rows: [
          ['sku', 'quantity_out'],
          ['PRD-001', '3'],
        ],
      },
    ]);
  });

  it('refuses a file with headers only', async () => {
    const file = new File(['sku,fecha\n'], 'vacio.csv');
    await expect(readSpreadsheet(file)).rejects.toBeInstanceOf(SpreadsheetError);
  });

  it('refuses what is not a CSV or an Excel', async () => {
    const file = new File(['x'], 'datos.pdf');
    await expect(readSpreadsheet(file)).rejects.toThrow('no es un Excel ni un CSV');
    expect(isAcceptedFile('Kardex.XLSX')).toBe(true);
    expect(isAcceptedFile('kardex.xls')).toBe(false);
  });

  it('reports an unreadable Excel in Spanish', async () => {
    const file = new File(['not a zip'], 'roto.xlsx');
    await expect(readSpreadsheet(file)).rejects.toThrow('No pudimos abrir este Excel');
  });
});

describe('readSpreadsheet with an Excel file', () => {
  it('reads every sheet, keeping numbers and dates typed', async () => {
    const bytes = readFileSync(
      fileURLToPath(new URL('./__fixtures__/kardex.xlsx', import.meta.url)),
    );
    const read = await readSpreadsheet(new File([bytes], 'kardex.xlsx'));
    expect(read.sheets.map((sheet) => sheet.name)).toEqual(['Instrucciones', 'Kardex']);
    const kardex = read.sheets[1];
    expect(kardex.rows[0]).toEqual([
      'Comprobante',
      'Línea',
      'Fecha',
      'Bodega',
      'SKU',
      'Tipo',
      'Salidas',
    ]);
    expect(kardex.rows[1]).toEqual([
      'FV-1',
      1,
      new Date(Date.UTC(2025, 7, 4)),
      'TDA-NORTE',
      'PRD-051',
      'Venta',
      2.5,
    ]);
  });

  it('turns an Excel kardex into the rows the API takes', async () => {
    const bytes = readFileSync(
      fileURLToPath(new URL('./__fixtures__/kardex.xlsx', import.meta.url)),
    );
    const read = await readSpreadsheet(new File([bytes], 'kardex.xlsx'));
    const kardex = read.sheets[1];
    const rows = buildRows(kardex, autoMap(headersOf(kardex)));
    expect(rows).toEqual([
      {
        rowNumber: 2,
        values: expect.objectContaining({
          external_movement_id: 'FV-1',
          line_number: '1',
          business_date: '2025-08-04',
          warehouse_code: 'TDA-NORTE',
          sku: 'PRD-051',
          movement_type: 'SALE',
          quantity_in: null,
          quantity_out: '2.5',
        }),
      },
    ]);
  });
});
