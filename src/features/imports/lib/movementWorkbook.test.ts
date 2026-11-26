import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TEMPLATE_COLUMNS } from '../types/movementImports.types';
import {
  autoMap,
  isTemplateFile,
  MOVEMENT_SHEET_NAME,
  MOVEMENT_TEMPLATE_FILE_NAME,
  MOVEMENT_TEMPLATE_HEADERS,
  pickMovementSheet,
  toMovementCode,
} from './movementTemplate';
import { headersOf, readSpreadsheet } from './spreadsheet';

/** The workbook users download, as published in `public/templates/`. */
async function published() {
  const path = fileURLToPath(
    new URL(`../../../../public/templates/${MOVEMENT_TEMPLATE_FILE_NAME}`, import.meta.url),
  );
  return readSpreadsheet(new File([readFileSync(path)], MOVEMENT_TEMPLATE_FILE_NAME));
}

describe('the published movements workbook', () => {
  it('opens on its instructions, with the data sheet after them', async () => {
    const book = await published();
    expect(book.sheets.map((sheet) => sheet.name)).toEqual(['Instrucciones', MOVEMENT_SHEET_NAME]);
    expect(pickMovementSheet(book.sheets)?.name).toBe(MOVEMENT_SHEET_NAME);
  });

  it('has the headers the importer joins, every column of the template', async () => {
    const sheet = pickMovementSheet((await published()).sheets)!;
    const headers = headersOf(sheet);
    expect(headers).toEqual(Object.values(MOVEMENT_TEMPLATE_HEADERS));
    expect(isTemplateFile(headers)).toBe(true);
    const mapping = autoMap(headers);
    for (const column of TEMPLATE_COLUMNS) {
      expect(headers[mapping[column] as number]).toBe(MOVEMENT_TEMPLATE_HEADERS[column]);
    }
  });

  it('lists movement types the importer understands', () => {
    for (const word of [
      'Saldo inicial',
      'Compra',
      'Venta',
      'Consumo interno',
      'Ajuste entrada',
      'Ajuste salida',
      'Traslado salida',
      'Traslado entrada',
    ]) {
      expect(toMovementCode(word)).toMatch(/^[A-Z_]+$/);
    }
  });
});

describe('pickMovementSheet', () => {
  const sheet = (name: string, data: boolean) => ({
    name,
    rows: data ? [['a'], ['1']] : [['a']],
  });

  it('takes the Movimientos sheet wherever it is, ignoring case', () => {
    expect(
      pickMovementSheet([sheet('Instrucciones', true), sheet('MOVIMIENTOS', false)])?.name,
    ).toBe('MOVIMIENTOS');
  });

  it('otherwise takes the first sheet holding rows, as a CSV has', () => {
    expect(pickMovementSheet([sheet('Vacía', false), sheet('kardex.csv', true)])?.name).toBe(
      'kardex.csv',
    );
    expect(pickMovementSheet([sheet('Vacía', false)])).toBeUndefined();
  });
});
