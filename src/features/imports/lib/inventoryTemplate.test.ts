import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { INVENTORY_FIELD_KEYS } from '../types/inventoryImports.types';
import {
  autoMapInventory,
  buildInventoryRows,
  INVENTORY_FIELDS,
  INVENTORY_TEMPLATE_FILE_NAME,
  missingInventoryFields,
  pickInventorySheet,
  readInventoryFile,
  toApiMapping,
  toInventoryValue,
} from './inventoryTemplate';
import { readSpreadsheet, type SheetData } from './spreadsheet';

const TEMPLATE_HEADERS = [
  'Código producto *',
  'Producto *',
  'Categoría *',
  'Unidad de medida *',
  'Bodega *',
  'Seguimiento *',
  'Saldo inicial *',
  'Costo unitario',
  'Código de lote **',
  'Ubicación',
  'Fecha fabricación',
  'Fecha vencimiento',
  'Tipo de almacén',
  'Código de bodega',
  'Dirección de bodega',
  'Descripción',
  'Largo (cm)',
  'Ancho (cm)',
  'Alto (cm)',
  'Peso (kg)',
  'Volumen (L)',
];

describe('the published template', () => {
  it('is read with every field joined to its own column', async () => {
    const path = `../../../../public/templates/${INVENTORY_TEMPLATE_FILE_NAME}`;
    const bytes = readFileSync(fileURLToPath(new URL(path, import.meta.url)));
    const read = await readSpreadsheet(new File([bytes], INVENTORY_TEMPLATE_FILE_NAME));
    expect(read.sheets.map((sheet) => sheet.name)).toEqual(['Inventario', 'Instrucciones']);

    const file = readInventoryFile(read.sheets);
    expect(file?.sheet.name).toBe('Inventario');
    expect(file?.headers).toEqual(TEMPLATE_HEADERS);
    INVENTORY_FIELD_KEYS.forEach((key, index) => expect(file?.mapping[key]).toBe(index));
    // The template has no data: nothing to send yet.
    expect(buildInventoryRows(file!.sheet, file!.mapping)).toEqual([]);
  });
});

describe('autoMapInventory', () => {
  it('ignores case, accents and the required markers', () => {
    const mapping = autoMapInventory(['BODEGA', 'codigo producto', 'Saldo Inicial**']);
    expect(mapping.warehouse).toBe(0);
    expect(mapping.sku).toBe(1);
    expect(mapping.stockQuantity).toBe(2);
    expect(mapping.name).toBeNull();
  });

  it('knows the usual names of a company file and uses each header once', () => {
    const mapping = autoMapInventory(['Referencia', 'Nombre', 'Existencias', 'Costo', 'Código']);
    // Aliases are tried in their order: "Código" before "Referencia".
    expect(mapping.sku).toBe(4);
    expect(mapping.name).toBe(1);
    expect(mapping.stockQuantity).toBe(2);
    expect(mapping.unitCost).toBe(3);
    expect(Object.values(mapping)).not.toContain(0);
  });

  it('prefers the template header over an alias', () => {
    const mapping = autoMapInventory(['Código', 'Código producto']);
    expect(mapping.sku).toBe(1);
  });
});

describe('missingInventoryFields', () => {
  it('lists the required fields no column feeds', () => {
    const missing = missingInventoryFields(autoMapInventory(['Código producto', 'Producto']));
    expect(missing.map((f) => f.key)).toEqual([
      'category',
      'stockUnit',
      'warehouse',
      'tracksLots',
      'stockQuantity',
    ]);
    expect(INVENTORY_FIELDS.filter((f) => f.required)).toHaveLength(7);
  });
});

describe('toApiMapping', () => {
  it('numbers columns from 1 and keeps the header as written', () => {
    const headers = ['Bodega *', 'Código producto *'];
    const api = toApiMapping(autoMapInventory(headers), headers);
    expect(api.warehouse).toEqual({ column: 1, header: 'Bodega *' });
    expect(api.sku).toEqual({ column: 2, header: 'Código producto *' });
    expect(api.unitCost).toBeNull();
    expect(Object.keys(api)).toEqual([...INVENTORY_FIELD_KEYS]);
  });
});

describe('toInventoryValue', () => {
  it('sends text as written, trimmed, and blanks as null', () => {
    expect(toInventoryValue('sku', '  00123 ')).toBe('00123');
    expect(toInventoryValue('sku', '   ')).toBeNull();
    expect(toInventoryValue('unitCost', null)).toBeNull();
    expect(toInventoryValue('unitCost', undefined)).toBeNull();
    // A text date is the API's to read (it also takes DD/MM/AAAA).
    expect(toInventoryValue('expiryDate', '31/12/2027')).toBe('31/12/2027');
  });

  it('writes numbers with a dot, no thousands separator and no float noise', () => {
    expect(toInventoryValue('stockQuantity', 1500)).toBe('1500');
    expect(toInventoryValue('unitCost', 1250.5)).toBe('1250.5');
    expect(toInventoryValue('unitCost', 0.1 + 0.2)).toBe('0.3');
    expect(toInventoryValue('stockQuantity', 0)).toBe('0');
  });

  it('writes Excel dates as YYYY-MM-DD, only in date fields', () => {
    expect(toInventoryValue('expiryDate', new Date(Date.UTC(2027, 11, 31)))).toBe('2027-12-31');
    expect(toInventoryValue('manufactureDate', 46387)).toBe('2026-12-31');
    expect(toInventoryValue('stockQuantity', 46387)).toBe('46387');
  });
});

describe('buildInventoryRows', () => {
  const sheet: SheetData = {
    name: 'Inventario',
    rows: [
      ['Código producto *', 'Producto *', 'Saldo inicial *', 'Notas'],
      ['007', 'Tornillo', 500, 'x'],
      [null, '', null, null],
      ['ACE-1', 'Aceite', 0, null],
    ],
  };

  it('keeps the file row number, skips blank rows and sends only mapped fields', () => {
    const rows = buildInventoryRows(sheet, autoMapInventory(sheet.rows[0] as string[]));
    expect(rows).toEqual([
      { rowNumber: 2, values: { sku: '007', name: 'Tornillo', stockQuantity: '500' } },
      { rowNumber: 4, values: { sku: 'ACE-1', name: 'Aceite', stockQuantity: '0' } },
    ]);
  });
});

describe('pickInventorySheet', () => {
  const sheet = (name: string, data: boolean): SheetData => ({
    name,
    rows: data ? [['a'], ['1']] : [['a']],
  });

  it('takes the Inventario sheet wherever it is, ignoring case', () => {
    const sheets = [sheet('Instrucciones', true), sheet('INVENTARIO', false)];
    expect(pickInventorySheet(sheets)?.name).toBe('INVENTARIO');
  });

  it('otherwise takes the first sheet with rows, as a CSV has', () => {
    const sheets = [sheet('Vacía', false), sheet('stock.csv', true)];
    expect(pickInventorySheet(sheets)?.name).toBe('stock.csv');
    expect(pickInventorySheet([sheet('Vacía', false)])).toBeUndefined();
  });
});
