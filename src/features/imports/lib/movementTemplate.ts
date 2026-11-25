import {
  IMPORT_LIMITS,
  MOVEMENT_CODES,
  TEMPLATE_COLUMNS,
  type ImportRow,
  type MovementCode,
  type TemplateColumn,
} from '../types/movementImports.types';
import { isEmptyRow, type Cell, type SheetData } from './spreadsheet';

/** Which column of the file (its index) carries each template column; null = none. */
export type ColumnMapping = Record<TemplateColumn, number | null>;

export interface TemplateField {
  column: TemplateColumn;
  label: string;
  required: boolean;
  hint?: string;
  example: string;
  /** Other header names it is recognized by, already normalized (see `normalizeHeader`). */
  aliases: string[];
}

/**
 * The 14 columns of the v1 template, with the names a company file usually gives them. Required
 * here means the API refuses every row without it; the quantities are checked as a pair
 * (`quantityMissing`).
 */
export const TEMPLATE_FIELDS: TemplateField[] = [
  {
    column: 'external_movement_id',
    label: 'Número del movimiento',
    required: true,
    hint: 'el código del documento en tu sistema',
    example: 'FV-001',
    aliases: ['id_movimiento', 'numero_movimiento', 'movimiento', 'comprobante', 'consecutivo'],
  },
  {
    column: 'line_number',
    label: 'Línea',
    required: true,
    hint: '1, 2, 3… dentro del movimiento',
    example: '1',
    aliases: ['linea', 'numero_linea', 'renglon', 'item'],
  },
  {
    column: 'business_date',
    label: 'Fecha',
    required: true,
    example: '2025-08-04',
    aliases: ['fecha', 'fecha_movimiento', 'fecha_documento', 'date'],
  },
  {
    column: 'warehouse_code',
    label: 'Código de bodega',
    required: true,
    example: 'BOD-CENTRAL',
    aliases: ['bodega', 'codigo_bodega', 'cod_bodega', 'almacen', 'codigo_almacen', 'warehouse'],
  },
  {
    column: 'sku',
    label: 'Código del producto (SKU)',
    required: true,
    example: 'PRD-001',
    aliases: ['codigo_producto', 'cod_producto', 'referencia', 'codigo', 'producto', 'item_code'],
  },
  {
    column: 'stock_unit',
    label: 'Unidad',
    required: false,
    hint: 'si falta, se usa la del producto',
    example: 'EA',
    aliases: ['unidad', 'unidad_medida', 'unidad_de_medida', 'um', 'unit'],
  },
  {
    column: 'movement_type',
    label: 'Tipo de movimiento',
    required: true,
    example: 'SALE',
    aliases: ['tipo', 'tipo_movimiento', 'tipo_de_movimiento', 'type'],
  },
  {
    column: 'quantity_in',
    label: 'Cantidad que entra',
    required: false,
    example: '20',
    aliases: ['entrada', 'entradas', 'cantidad_entrada', 'cant_entrada', 'qty_in'],
  },
  {
    column: 'quantity_out',
    label: 'Cantidad que sale',
    required: false,
    example: '12',
    aliases: ['salida', 'salidas', 'cantidad_salida', 'cant_salida', 'qty_out'],
  },
  {
    column: 'balance_after',
    label: 'Saldo después del movimiento',
    required: false,
    hint: 'para comprobar los saldos',
    example: '108',
    aliases: ['saldo', 'saldo_final', 'saldo_despues', 'balance'],
  },
  {
    column: 'document_ref',
    label: 'Documento',
    required: false,
    hint: 'factura, orden de compra…',
    example: 'INV-100',
    aliases: ['documento', 'referencia_documento', 'num_documento', 'factura', 'document'],
  },
  {
    column: 'location_code',
    label: 'Ubicación',
    required: false,
    hint: 'si falta, la ubicación principal de la bodega',
    example: 'DEFAULT',
    aliases: ['ubicacion', 'codigo_ubicacion', 'location'],
  },
  {
    column: 'lot_code',
    label: 'Lote',
    required: false,
    hint: 'obligatorio en productos con lote',
    example: 'L-2025-01',
    aliases: ['lote', 'codigo_lote', 'lot'],
  },
  {
    column: 'unit_cost',
    label: 'Costo unitario',
    required: false,
    example: '10.50',
    aliases: ['costo', 'costo_unitario', 'valor_unitario', 'cost'],
  },
];

/** `Código de Bodega ` → `codigo_de_bodega`: lower case, no accents, words joined by `_`. */
export function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Joins the file's headers to the template by name: first the exact template names, then the
 * usual aliases. Each header is used once.
 */
export function autoMap(headers: readonly string[]): ColumnMapping {
  const normalized = headers.map(normalizeHeader);
  const used = new Set<number>();
  const mapping = Object.fromEntries(TEMPLATE_COLUMNS.map((c) => [c, null])) as ColumnMapping;

  const take = (field: TemplateField, names: string[]) => {
    if (mapping[field.column] !== null) return;
    for (const name of names) {
      const index = normalized.findIndex((header, i) => header === name && !used.has(i));
      if (index >= 0) {
        mapping[field.column] = index;
        used.add(index);
        return;
      }
    }
  };
  for (const field of TEMPLATE_FIELDS) take(field, [field.column]);
  for (const field of TEMPLATE_FIELDS) take(field, field.aliases);
  return mapping;
}

/** Every template column is joined by its exact name: the file is Pango's template. */
export function isTemplateFile(headers: readonly string[]): boolean {
  const normalized = new Set(headers.map(normalizeHeader));
  return TEMPLATE_COLUMNS.every((column) => normalized.has(column));
}

/** Required columns that are not joined to any column of the file. */
export function missingFields(mapping: ColumnMapping): TemplateField[] {
  return TEMPLATE_FIELDS.filter((field) => field.required && mapping[field.column] === null);
}

/** Neither quantity column is joined: no row could carry a quantity. */
export function quantityMissing(mapping: ColumnMapping): boolean {
  return mapping.quantity_in === null && mapping.quantity_out === null;
}

/** Words people use for each movement code, normalized like a header. */
const MOVEMENT_ALIASES: Record<string, MovementCode> = {
  saldo_inicial: 'OPENING_BALANCE',
  inventario_inicial: 'OPENING_BALANCE',
  apertura: 'OPENING_BALANCE',
  compra: 'PURCHASE_RECEIPT',
  compras: 'PURCHASE_RECEIPT',
  entrada_compra: 'PURCHASE_RECEIPT',
  recepcion_compra: 'PURCHASE_RECEIPT',
  venta: 'SALE',
  ventas: 'SALE',
  salida_venta: 'SALE',
  consumo: 'INTERNAL_CONSUMPTION',
  consumo_interno: 'INTERNAL_CONSUMPTION',
  ajuste_entrada: 'ADJUSTMENT_IN',
  ajuste_positivo: 'ADJUSTMENT_IN',
  ajuste_salida: 'ADJUSTMENT_OUT',
  ajuste_negativo: 'ADJUSTMENT_OUT',
  traslado_salida: 'TRANSFER_OUT',
  transferencia_salida: 'TRANSFER_OUT',
  traslado_entrada: 'TRANSFER_IN',
  transferencia_entrada: 'TRANSFER_IN',
};

/** A movement type as the template wants it; an unknown word is sent as is for the API to report. */
export function toMovementCode(text: string): string {
  const key = normalizeHeader(text);
  const code = key.toUpperCase();
  if ((MOVEMENT_CODES as readonly string[]).includes(code)) return code;
  return MOVEMENT_ALIASES[key] ?? text.trim();
}

const pad = (n: number) => String(n).padStart(2, '0');

/** A date as `YYYY-MM-DD`, from its UTC parts (Excel dates carry no time zone). */
export function isoDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Excel serial day (days since 1899-12-30) to a date. */
function fromExcelSerial(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86_400_000));
}

/** A date written as text, in the template format when it is recognized. */
function normalizeDateText(text: string): string {
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T].*)?$/.exec(text);
  if (iso) return `${iso[1]}-${pad(Number(iso[2]))}-${pad(Number(iso[3]))}`;
  const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:\s.*)?$/.exec(text);
  if (dmy) return `${dmy[3]}-${pad(Number(dmy[2]))}-${pad(Number(dmy[1]))}`;
  return text;
}

/** A number without the float noise Excel can leave (`0.30000000000000004` → `0.3`). */
function numberText(value: number): string {
  return String(Number(value.toPrecision(15)));
}

/**
 * One cell in the template format: text trimmed (empty = null), dates as `YYYY-MM-DD`, numbers
 * with a `.` and no thousands separators, movement types as their code. What cannot be read is
 * sent as written, so the API reports it on its row.
 */
export function toTemplateValue(column: TemplateColumn, cell: Cell | undefined): string | null {
  if (cell === null || cell === undefined) return null;
  let value: string;
  if (cell instanceof Date) {
    value = Number.isNaN(cell.getTime()) ? '' : isoDate(cell);
  } else if (typeof cell === 'number') {
    value =
      column === 'business_date' && cell > 0 && cell < 2_958_466
        ? isoDate(fromExcelSerial(cell))
        : numberText(cell);
  } else if (typeof cell === 'boolean') {
    value = String(cell);
  } else {
    value = cell.trim();
    if (column === 'business_date') value = normalizeDateText(value);
  }
  if (value === '') return null;
  if (column === 'movement_type') value = toMovementCode(value);
  return value.slice(0, IMPORT_LIMITS.maxValueChars);
}

/**
 * The rows to send: every non-empty data row of the sheet with its template values. `rowNumber`
 * is the row in the user's file (the header is row 1), so the issues point at the right line.
 */
export function buildRows(sheet: SheetData, mapping: ColumnMapping): ImportRow[] {
  const rows: ImportRow[] = [];
  sheet.rows.forEach((cells, index) => {
    if (index === 0 || isEmptyRow(cells)) return;
    const values = {} as ImportRow['values'];
    for (const column of TEMPLATE_COLUMNS) {
      const source = mapping[column];
      values[column] = source === null ? null : toTemplateValue(column, cells[source]);
    }
    rows.push({ rowNumber: index + 1, values });
  });
  return rows;
}

/** Splits a list in consecutive pieces of at most `size`. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const pieces: T[][] = [];
  for (let i = 0; i < items.length; i += size) pieces.push(items.slice(i, i + size));
  return pieces;
}

/** `sourceNamespace` as the API accepts it: letters, digits, `.`, `_`, `-`, up to 60. */
export const SOURCE_NAMESPACE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,59}$/;

/** `Siigo principal` → `siigo-principal`: a valid namespace suggested from what the user wrote. */
export function toSourceNamespace(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[^a-z0-9]+/, '')
    .slice(0, 60);
}

/** The template's header row, for the download. */
export function templateCsv(): string {
  return `${TEMPLATE_COLUMNS.join(',')}\n`;
}
