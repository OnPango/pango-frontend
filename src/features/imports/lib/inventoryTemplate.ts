import {
  INVENTORY_FIELD_KEYS,
  type InventoryFieldKey,
  type InventoryMapping,
  type InventoryRow,
} from '../types/inventoryImports.types';
import {
  excelSerialToDate,
  headersOf,
  isEmptyRow,
  isoDate,
  normalizeHeader,
  numberText,
  type Cell,
  type SheetData,
} from './spreadsheet';

/** The published template, served from `public/`. Bump the version when its columns change. */
export const INVENTORY_TEMPLATE_URL = '/templates/Plantilla_Inventario_PANGO_v1.xlsx';
export const INVENTORY_TEMPLATE_FILE_NAME = 'Plantilla_Inventario_PANGO_v1.xlsx';

/** The data sheet of the template. */
export const INVENTORY_SHEET_NAME = 'Inventario';

/** Which column of the file (its index) feeds each field; null = none. */
export type InventoryColumnMapping = Record<InventoryFieldKey, number | null>;

export interface InventoryField {
  key: InventoryFieldKey;
  /** The template's header without its `*` / `**` marker. */
  label: string;
  /** The API refuses the import if the file has no column for it. */
  required: boolean;
  /** Other header names it is recognized by, already normalized (see `normalizeHeader`). */
  aliases: string[];
}

const field = (
  key: InventoryFieldKey,
  label: string,
  required = false,
  aliases: string[] = [],
): InventoryField => ({ key, label, required, aliases });

/** The 21 columns of the template (A–U), with the names a company's own file usually gives them. */
export const INVENTORY_FIELDS: InventoryField[] = [
  field('sku', 'Código producto', true, ['codigo', 'referencia', 'sku', 'cod_producto']),
  field('name', 'Producto', true, ['nombre', 'nombre_producto', 'descripcion_producto']),
  field('category', 'Categoría', true, ['categoria_producto', 'grupo', 'linea']),
  field('stockUnit', 'Unidad de medida', true, ['unidad', 'um', 'unidad_medida']),
  field('warehouse', 'Bodega', true, ['nombre_bodega', 'almacen']),
  field('tracksLots', 'Seguimiento', true, ['tipo_seguimiento']),
  field('stockQuantity', 'Saldo inicial', true, ['saldo', 'cantidad', 'existencias', 'stock']),
  field('unitCost', 'Costo unitario', false, ['costo', 'costo_promedio', 'valor_unitario']),
  field('lotCode', 'Código de lote', false, ['lote', 'codigo_lote']),
  field('locationCode', 'Ubicación', false, ['codigo_ubicacion']),
  field('manufactureDate', 'Fecha fabricación', false, ['fecha_de_fabricacion']),
  field('expiryDate', 'Fecha vencimiento', false, ['fecha_de_vencimiento', 'vencimiento']),
  field('warehouseType', 'Tipo de almacén', false, ['tipo_almacen', 'tipo_bodega']),
  field('warehouseCode', 'Código de bodega', false, ['codigo_bodega', 'cod_bodega']),
  field('warehouseAddress', 'Dirección de bodega', false, ['direccion_bodega', 'direccion']),
  field('description', 'Descripción'),
  field('lengthCm', 'Largo (cm)', false, ['largo']),
  field('widthCm', 'Ancho (cm)', false, ['ancho']),
  field('heightCm', 'Alto (cm)', false, ['alto']),
  field('weightKg', 'Peso (kg)', false, ['peso']),
  field('volumeL', 'Volumen (L)', false, ['volumen']),
];

const DATE_FIELDS = new Set<InventoryFieldKey>(['manufactureDate', 'expiryDate']);

/** The template's `Inventario` sheet when present, otherwise the first sheet holding rows. */
export function pickInventorySheet(sheets: readonly SheetData[]): SheetData | undefined {
  const wanted = normalizeHeader(INVENTORY_SHEET_NAME);
  return (
    sheets.find((sheet) => normalizeHeader(sheet.name) === wanted) ??
    sheets.find((sheet) => sheet.rows.slice(1).some((row) => !isEmptyRow(row)))
  );
}

/**
 * Joins the file's headers to the fields by name, ignoring case, accents and the `*` markers:
 * first the template headers, then the usual aliases. Each header is used once.
 */
export function autoMapInventory(headers: readonly string[]): InventoryColumnMapping {
  const normalized = headers.map(normalizeHeader);
  const used = new Set<number>();
  const mapping = Object.fromEntries(
    INVENTORY_FIELD_KEYS.map((key) => [key, null]),
  ) as InventoryColumnMapping;

  const take = (f: InventoryField, names: string[]) => {
    if (mapping[f.key] !== null) return;
    for (const name of names) {
      const index = normalized.findIndex((header, i) => header === name && !used.has(i));
      if (index >= 0) {
        mapping[f.key] = index;
        used.add(index);
        return;
      }
    }
  };
  for (const f of INVENTORY_FIELDS) take(f, [normalizeHeader(f.label)]);
  for (const f of INVENTORY_FIELDS) take(f, f.aliases);
  return mapping;
}

/** Required fields that no column of the file feeds. */
export function missingInventoryFields(mapping: InventoryColumnMapping): InventoryField[] {
  return INVENTORY_FIELDS.filter((f) => f.required && mapping[f.key] === null);
}

/** The mapping as `POST /inventory-imports` takes it: 1-based column and the header as written. */
export function toApiMapping(
  mapping: InventoryColumnMapping,
  headers: readonly string[],
): InventoryMapping {
  return Object.fromEntries(
    INVENTORY_FIELD_KEYS.map((key) => {
      const index = mapping[key];
      return [key, index === null ? null : { column: index + 1, header: headers[index] ?? '' }];
    }),
  ) as InventoryMapping;
}

/**
 * One cell as text, the way the API reads it: trimmed (empty = null), numbers with `.` and no
 * thousands separator, Excel dates as `YYYY-MM-DD`. Codes typed as text keep their leading zeros.
 * Nothing is checked or fixed here: the API reports wrong values on their row.
 */
export function toInventoryValue(key: InventoryFieldKey, cell: Cell | undefined): string | null {
  if (cell === null || cell === undefined) return null;
  let value: string;
  if (cell instanceof Date) {
    value = Number.isNaN(cell.getTime()) ? '' : isoDate(cell);
  } else if (typeof cell === 'number') {
    value =
      DATE_FIELDS.has(key) && cell > 0 && cell < 2_958_466
        ? isoDate(excelSerialToDate(cell))
        : numberText(cell);
  } else if (typeof cell === 'boolean') {
    value = String(cell);
  } else {
    value = cell.trim();
  }
  return value === '' ? null : value;
}

/**
 * The rows to send: every non-empty data row with the values of the mapped fields. `rowNumber` is
 * the row in the user's file (the header is row 1), so the issues point at the right line.
 */
export function buildInventoryRows(
  sheet: SheetData,
  mapping: InventoryColumnMapping,
): InventoryRow[] {
  const mapped = INVENTORY_FIELD_KEYS.filter((key) => mapping[key] !== null);
  const rows: InventoryRow[] = [];
  sheet.rows.forEach((cells, index) => {
    if (index === 0 || isEmptyRow(cells)) return;
    const values: InventoryRow['values'] = {};
    for (const key of mapped) values[key] = toInventoryValue(key, cells[mapping[key] as number]);
    rows.push({ rowNumber: index + 1, values });
  });
  return rows;
}

/** Everything read from a workbook that the next steps need. */
export interface InventoryFile {
  sheet: SheetData;
  headers: string[];
  mapping: InventoryColumnMapping;
}

/** Picks the sheet, reads its headers and proposes the mapping; undefined when no sheet has rows. */
export function readInventoryFile(sheets: readonly SheetData[]): InventoryFile | undefined {
  const sheet = pickInventorySheet(sheets);
  if (!sheet) return undefined;
  const headers = headersOf(sheet);
  return { sheet, headers, mapping: autoMapInventory(headers) };
}
