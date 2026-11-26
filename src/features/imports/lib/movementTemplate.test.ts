import { describe, expect, it } from 'vitest';
import { TEMPLATE_COLUMNS } from '../types/movementImports.types';
import {
  autoMap,
  buildRows,
  chunk,
  isTemplateFile,
  missingFields,
  quantityMissing,
  SOURCE_NAMESPACE_PATTERN,
  templateCsv,
  toMovementCode,
  toSourceNamespace,
  toTemplateValue,
  type ColumnMapping,
} from './movementTemplate';
import { normalizeHeader } from './spreadsheet';

const emptyMapping = () =>
  Object.fromEntries(TEMPLATE_COLUMNS.map((c) => [c, null])) as ColumnMapping;

describe('autoMap', () => {
  it('joins every column of the template by its exact name, in any order', () => {
    const headers = [...TEMPLATE_COLUMNS].reverse();
    const mapping = autoMap(headers);
    for (const column of TEMPLATE_COLUMNS) {
      expect(headers[mapping[column] as number]).toBe(column);
    }
    expect(isTemplateFile(headers)).toBe(true);
  });

  it('joins the usual Spanish names, ignoring case and accents', () => {
    const headers = [
      'Fecha',
      'Código Bodega',
      'Referencia',
      'Tipo de Movimiento',
      'Salidas',
      'Línea',
      'Comprobante',
    ];
    const mapping = autoMap(headers);
    expect(mapping.business_date).toBe(0);
    expect(mapping.warehouse_code).toBe(1);
    expect(mapping.sku).toBe(2);
    expect(mapping.movement_type).toBe(3);
    expect(mapping.quantity_out).toBe(4);
    expect(mapping.line_number).toBe(5);
    expect(mapping.external_movement_id).toBe(6);
    expect(mapping.quantity_in).toBeNull();
    expect(isTemplateFile(headers)).toBe(false);
  });

  it('uses each header once, preferring the exact template name', () => {
    const mapping = autoMap(['sku', 'Código']);
    expect(mapping.sku).toBe(0);
    expect(mapping.external_movement_id).toBeNull();
  });

  it('normalizes headers', () => {
    expect(normalizeHeader('  Código de Bodega ')).toBe('codigo_de_bodega');
    expect(normalizeHeader('Cant. (salida)')).toBe('cant_salida');
  });
});

describe('required columns', () => {
  it('lists the required columns that are not joined', () => {
    const mapping = { ...emptyMapping(), sku: 0, business_date: 1 };
    expect(missingFields(mapping).map((f) => f.column)).toEqual([
      'external_movement_id',
      'line_number',
      'warehouse_code',
      'movement_type',
    ]);
  });

  it('needs at least one quantity column', () => {
    expect(quantityMissing(emptyMapping())).toBe(true);
    expect(quantityMissing({ ...emptyMapping(), quantity_out: 3 })).toBe(false);
  });
});

describe('toTemplateValue', () => {
  it('sends empty cells as null and trims text', () => {
    expect(toTemplateValue('sku', null)).toBeNull();
    expect(toTemplateValue('sku', undefined)).toBeNull();
    expect(toTemplateValue('sku', '   ')).toBeNull();
    expect(toTemplateValue('sku', ' PRD-001 ')).toBe('PRD-001');
  });

  it('writes Excel dates, serial days and day-first text as YYYY-MM-DD', () => {
    expect(toTemplateValue('business_date', new Date(Date.UTC(2025, 7, 4)))).toBe('2025-08-04');
    expect(toTemplateValue('business_date', 45873)).toBe('2025-08-04');
    expect(toTemplateValue('business_date', '4/8/2025')).toBe('2025-08-04');
    expect(toTemplateValue('business_date', '04-08-2025')).toBe('2025-08-04');
    expect(toTemplateValue('business_date', '2025-8-4 00:00:00')).toBe('2025-08-04');
    expect(toTemplateValue('business_date', 'ayer')).toBe('ayer');
  });

  it('writes numbers with a point and without float noise', () => {
    expect(toTemplateValue('quantity_out', 12)).toBe('12');
    expect(toTemplateValue('unit_cost', 0.1 + 0.2)).toBe('0.3');
    expect(toTemplateValue('line_number', 1)).toBe('1');
    // Text is sent as written: the API reports what it cannot read on its row.
    expect(toTemplateValue('quantity_out', '1.234,5')).toBe('1.234,5');
  });

  it('writes movement types as their code', () => {
    expect(toTemplateValue('movement_type', 'sale')).toBe('SALE');
    expect(toTemplateValue('movement_type', 'Venta')).toBe('SALE');
    expect(toTemplateValue('movement_type', 'Saldo inicial')).toBe('OPENING_BALANCE');
    expect(toTemplateValue('movement_type', 'Traslado salida')).toBe('TRANSFER_OUT');
    expect(toMovementCode('purchase receipt')).toBe('PURCHASE_RECEIPT');
    expect(toMovementCode(' Devolución ')).toBe('Devolución');
  });

  it('cuts values to the 1,000 characters the API accepts per value', () => {
    expect(toTemplateValue('document_ref', 'x'.repeat(1500))).toHaveLength(1000);
  });
});

describe('buildRows', () => {
  const sheet = {
    name: 'Kardex',
    rows: [
      ['Fecha', 'SKU', 'Tipo', 'Sale', 'Notas'],
      [new Date(Date.UTC(2025, 0, 2)), 'PRD-001', 'venta', 3, 'nada'],
      [null, '', '  ', null, null],
      ['2025-01-03', 'PRD-002', 'SALE', '1.5', null],
    ],
  };

  it('sends the non-empty data rows with their row number in the file', () => {
    const mapping = {
      ...emptyMapping(),
      business_date: 0,
      sku: 1,
      movement_type: 2,
      quantity_out: 3,
    };
    const rows = buildRows(sheet, mapping);
    expect(rows.map((r) => r.rowNumber)).toEqual([2, 4]);
    expect(rows[0].values).toEqual({
      ...Object.fromEntries(TEMPLATE_COLUMNS.map((c) => [c, null])),
      business_date: '2025-01-02',
      sku: 'PRD-001',
      movement_type: 'SALE',
      quantity_out: '3',
    });
    expect(Object.keys(rows[0].values)).toEqual([...TEMPLATE_COLUMNS]);
  });
});

describe('helpers', () => {
  it('splits a list in batches', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 2)).toEqual([]);
  });

  it('suggests a valid source namespace', () => {
    expect(toSourceNamespace('Siigo Principal')).toBe('siigo-principal');
    expect(toSourceNamespace('  _Excel de Bodega #2')).toBe('excel-de-bodega-2');
    expect(SOURCE_NAMESPACE_PATTERN.test('siigo-main')).toBe(true);
    expect(SOURCE_NAMESPACE_PATTERN.test('siigo main')).toBe(false);
    expect(SOURCE_NAMESPACE_PATTERN.test('-siigo')).toBe(false);
  });

  it('downloads the template header of pango-core', () => {
    expect(templateCsv()).toBe(
      'external_movement_id,line_number,business_date,warehouse_code,sku,stock_unit,movement_type,quantity_in,quantity_out,balance_after,document_ref,location_code,lot_code,unit_cost\n',
    );
  });
});
