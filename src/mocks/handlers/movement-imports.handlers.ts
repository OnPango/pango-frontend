import {
  IMPORT_LIMITS,
  MOVEMENT_CODES,
  TEMPLATE_COLUMNS,
  type ImportBalance,
  type ImportIssue,
  type ImportRow,
  type MovementImport,
  type TemplateColumn,
} from '@/features/imports/types/movementImports.types';
import { authorize, error } from '../guard';
import type { MockRoutes } from '../server';
import { findUnitRow, productsOf } from './catalog.handlers';
import { activeWarehousesOf } from './warehouses.handlers';

/**
 * The movement history import of pango-core (`docs/modules/movement-imports.md`): start, send rows
 * in batches, validate, confirm, and read the issues and balances. It checks the common cases
 * against the mock catalog and warehouses (required values, dates, numbers, movement types, SKUs,
 * warehouses, units, lots, quantity side, repeated keys, lines already imported and starting
 * balances); the API checks more (locations, documents, balances, roles per warehouse).
 */

const OUT_CODES = new Set(['SALE', 'INTERNAL_CONSUMPTION', 'ADJUSTMENT_OUT', 'TRANSFER_OUT']);
const DEMAND_CODES = new Set(['SALE', 'INTERNAL_CONSUMPTION']);
const REQUIRED: TemplateColumn[] = [
  'external_movement_id',
  'line_number',
  'business_date',
  'warehouse_code',
  'sku',
  'movement_type',
];

interface CheckedRow {
  row: ImportRow;
  status: 'VALID' | 'INVALID' | 'DUPLICATE';
  productId: number | null;
  warehouseId: number | null;
  date: string | null;
  quantity: number;
  side: 'IN' | 'OUT';
  balance: number | null;
}

interface ImportState {
  org: string;
  /** Mock user id of the uploader (the DTO's `uploadedById` is a number, like the API's). */
  uploader: string;
  data: MovementImport;
  rows: Map<number, ImportRow>;
  issues: ImportIssue[];
  checked: CheckedRow[];
}

const imports = new Map<number, ImportState>();
/** Lines saved into the history: `org|namespace|id|line` → the row's values, as JSON. */
const history = new Map<string, string>();
/** The saved lines, as `GET /historical-movements` lists them. */
interface SavedLine {
  id: number;
  org: string;
  importId: number;
  namespace: string;
  checked: CheckedRow;
}
const saved: SavedLine[] = [];
let lastId = 0;

const text = (value: string | null | undefined) => value?.trim() || null;
const lineKey = (org: string, namespace: string, values: ImportRow['values']) =>
  [org, namespace, text(values.external_movement_id), text(values.line_number)].join('|');
const content = (values: ImportRow['values']) =>
  JSON.stringify(TEMPLATE_COLUMNS.map((column) => text(values[column])));

function parseDate(value: string): string | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  const [y, m, d] = iso ? [iso[1], iso[2], iso[3]] : dmy ? [dmy[3], dmy[2], dmy[1]] : [];
  if (!y) return null;
  const date = new Date(`${y}-${m}-${d}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== `${y}-${m}-${d}`
    ? null
    : `${y}-${m}-${d}`;
}

const NUMBER = /^\d+(\.\d{1,4})?$/;

function validate(state: ImportState): void {
  const { org, data } = state;
  const products = new Map(productsOf(org).map((p) => [p.sku.toLowerCase(), p]));
  const warehouses = new Map(activeWarehousesOf(org).map((w) => [w.code.toLowerCase(), w]));
  const today = new Date().toISOString().slice(0, 10);
  const seen = new Map<string, string>();
  const issues: ImportIssue[] = [];
  const checked: CheckedRow[] = [];

  const sorted = [...state.rows.values()].sort((a, b) => a.rowNumber - b.rowNumber);
  for (const row of sorted) {
    const v = row.values;
    const rowIssues: ImportIssue[] = [];
    const add = (
      code: string,
      field: TemplateColumn | null,
      message: string,
      severity: ImportIssue['severity'] = 'ERROR',
    ) =>
      rowIssues.push({
        rowNumber: row.rowNumber,
        field,
        severity,
        code,
        message,
        value: field ? text(v[field]) : null,
      });

    for (const column of REQUIRED) {
      if (!text(v[column])) add('REQUIRED', column, `${column} is required`);
    }
    const dateText = text(v.business_date);
    const date = dateText ? parseDate(dateText) : null;
    if (dateText && !date) add('INVALID_DATE', 'business_date', 'Not a date');
    if (date && date > today) add('DATE_IN_FUTURE', 'business_date', 'Date after today');

    const code = text(v.movement_type)?.toUpperCase() ?? null;
    if (code && !(MOVEMENT_CODES as readonly string[]).includes(code)) {
      add('UNKNOWN_MOVEMENT_TYPE', 'movement_type', 'Unknown movement type');
    }
    const warehouseCode = text(v.warehouse_code);
    const warehouse = warehouseCode ? warehouses.get(warehouseCode.toLowerCase()) : undefined;
    if (warehouseCode && !warehouse)
      add('UNKNOWN_WAREHOUSE', 'warehouse_code', 'Unknown warehouse');
    const sku = text(v.sku);
    const product = sku ? products.get(sku.toLowerCase()) : undefined;
    if (sku && !product) add('UNKNOWN_SKU', 'sku', 'No product with this SKU');

    if (product) {
      const unit = text(v.stock_unit);
      const productUnit = findUnitRow(product.stockUnitId)?.code ?? 'EA';
      if (unit && unit.toUpperCase() !== productUnit) {
        add('UNIT_MISMATCH', 'stock_unit', `The product's unit is ${productUnit}`);
      }
      const lot = text(v.lot_code);
      if (product.tracksLots && !lot) add('LOT_REQUIRED', 'lot_code', 'The product tracks lots');
      if (!product.tracksLots && lot)
        add('LOT_NOT_ALLOWED', 'lot_code', 'No lots for this product');
    }

    for (const column of ['quantity_in', 'quantity_out', 'balance_after', 'unit_cost'] as const) {
      const value = text(v[column]);
      if (value && !NUMBER.test(value)) add('INVALID_NUMBER', column, 'Not a number');
    }
    const side = code && OUT_CODES.has(code) ? 'OUT' : 'IN';
    const quantityIn = Number(text(v.quantity_in) ?? 0);
    const quantityOut = Number(text(v.quantity_out) ?? 0);
    const quantity = side === 'IN' ? quantityIn : quantityOut;
    const wrongSide = side === 'IN' ? quantityOut > 0 : quantityIn > 0;
    if (
      code &&
      (wrongSide || (quantity <= 0 && code !== 'OPENING_BALANCE')) &&
      !rowIssues.some((i) => i.code === 'INVALID_NUMBER')
    ) {
      add(
        'QUANTITY_SIDE',
        side === 'IN' ? 'quantity_in' : 'quantity_out',
        'One quantity on the side of the movement',
      );
    }

    let status: CheckedRow['status'] = rowIssues.some((i) => i.severity === 'ERROR')
      ? 'INVALID'
      : 'VALID';
    if (status === 'VALID') {
      const key = lineKey(org, data.sourceNamespace, v);
      const earlier = seen.get(key);
      const saved = history.get(key);
      if (earlier !== undefined) {
        if (earlier === content(v)) {
          add('DUPLICATE_ROW', null, 'Repeats an earlier row', 'WARNING');
          status = 'DUPLICATE';
        } else {
          add('KEY_CONFLICT', 'external_movement_id', 'Same line with different content');
          status = 'INVALID';
        }
      } else if (saved !== undefined) {
        if (saved === content(v)) {
          add('ALREADY_IMPORTED', null, 'Already in the history', 'WARNING');
          status = 'DUPLICATE';
        } else {
          add('IMPORTED_DIFFERENTLY', 'external_movement_id', 'Imported before with other content');
          status = 'INVALID';
        }
      }
      seen.set(key, content(v));
    }

    const balanceText = text(v.balance_after);
    issues.push(...rowIssues);
    checked.push({
      row,
      status,
      productId: product?.id ?? null,
      warehouseId: warehouse?.id ?? null,
      date,
      quantity,
      side,
      balance: balanceText && NUMBER.test(balanceText) ? Number(balanceText) : null,
    });
  }

  // A pair with no opening balance and no reported balance gets one warning.
  const pairs = new Map<string, CheckedRow[]>();
  for (const row of checked.filter((r) => r.status === 'VALID')) {
    const key = `${row.productId}|${row.warehouseId}`;
    pairs.set(key, [...(pairs.get(key) ?? []), row]);
  }
  for (const rows of pairs.values()) {
    const starts = rows.some(
      (r) =>
        r.balance !== null || text(r.row.values.movement_type)?.toUpperCase() === 'OPENING_BALANCE',
    );
    if (!starts) {
      issues.push({
        rowNumber: rows[0].row.rowNumber,
        field: null,
        severity: 'WARNING',
        code: 'NO_BALANCE',
        message: 'No starting balance for this product and warehouse',
        value: null,
      });
    }
  }

  const issueCounts: Record<string, number> = {};
  for (const issue of issues) issueCounts[issue.code] = (issueCounts[issue.code] ?? 0) + 1;
  state.issues = issues;
  state.checked = checked;
  state.data = {
    ...data,
    status: 'VALIDATED',
    revision: data.revision + 1,
    rowCount: checked.length,
    validRowCount: checked.filter((r) => r.status === 'VALID').length,
    invalidRowCount: checked.filter((r) => r.status === 'INVALID').length,
    duplicateRowCount: checked.filter((r) => r.status === 'DUPLICATE').length,
    issueCounts,
  };
}

function balances(state: ImportState): ImportBalance[] {
  const org = state.org;
  const products = new Map(productsOf(org).map((p) => [p.id, p]));
  const warehouses = new Map(activeWarehousesOf(org).map((w) => [w.id, w]));
  const pairs = new Map<string, CheckedRow[]>();
  for (const row of state.checked.filter((r) => r.status === 'VALID')) {
    const key = `${row.warehouseId}|${row.productId}`;
    pairs.set(key, [...(pairs.get(key) ?? []), row]);
  }
  const result: ImportBalance[] = [];
  for (const rows of pairs.values()) {
    rows.sort(
      (a, b) => (a.date ?? '').localeCompare(b.date ?? '') || a.row.rowNumber - b.row.rowNumber,
    );
    let closing: number | null = null;
    let demand = 0;
    for (const row of rows) {
      const code = text(row.row.values.movement_type)?.toUpperCase() ?? '';
      if (code === 'OPENING_BALANCE') closing = row.quantity;
      else if (closing !== null) closing += row.side === 'IN' ? row.quantity : -row.quantity;
      if (row.balance !== null) closing = row.balance;
      if (DEMAND_CODES.has(code)) demand += row.quantity;
    }
    const product = products.get(rows[0].productId ?? -1);
    const warehouse = warehouses.get(rows[0].warehouseId ?? -1);
    if (!product || !warehouse) continue;
    result.push({
      product: {
        id: product.id,
        sku: product.sku,
        name: product.name,
        unit: findUnitRow(product.stockUnitId)?.code ?? 'EA',
      },
      warehouse: { id: warehouse.id, code: warehouse.code, name: warehouse.name },
      rows: rows.length,
      closing,
      demand,
    });
  }
  return result.sort(
    (a, b) =>
      a.warehouse.code.localeCompare(b.warehouse.code) ||
      a.product.sku.localeCompare(b.product.sku),
  );
}

function page<T>(items: T[], query: Record<string, string>) {
  const pageNumber = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 25));
  return {
    items: items.slice((pageNumber - 1) * pageSize, pageNumber * pageSize),
    total: items.length,
    page: pageNumber,
    pageSize,
  };
}

/** The import of the signed-in user's organization; only its uploader may change it. */
function load(id: string, own: boolean) {
  const auth = authorize('movement.import');
  if (auth.error) return { error: auth.error };
  const state = imports.get(Number(id));
  if (!state || state.org !== auth.user.organization_id) {
    return { error: error(404, 'IMPORT_NOT_FOUND', 'Movement import not found') };
  }
  if (own && state.uploader !== auth.user.id) {
    return {
      error: error(
        403,
        'IMPORT_NOT_YOURS',
        'Only the user who started the import can change or confirm it',
      ),
    };
  }
  return { state };
}

/** A number for `uploadedById`: mock user ids are strings. */
const numericUser = (id: string) => Number(id.replace(/\D/g, '')) || 1;

function report(state: ImportState, query: Record<string, string>) {
  const issues = state.issues.filter(
    (i) =>
      (!query.severity || i.severity === query.severity) && (!query.code || i.code === query.code),
  );
  return { import: state.data, issues: page(issues, query) };
}

export const movementImportsRoutes: MockRoutes = {
  'POST /movement-imports': ({ body }) => {
    const auth = authorize('movement.import');
    if (auth.error) return auth.error;
    const { sourceNamespace, fileName } = (body ?? {}) as {
      sourceNamespace?: string;
      fileName?: string;
    };
    if (!sourceNamespace || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,59}$/.test(sourceNamespace)) {
      return {
        status: 400,
        data: { statusCode: 400, message: ['sourceNamespace must match the pattern'] },
      };
    }
    const id = ++lastId;
    const data: MovementImport = {
      id,
      sourceNamespace: sourceNamespace.toLowerCase(),
      fileName: fileName ?? null,
      status: 'RECEIVING',
      revision: 0,
      rowCount: 0,
      validRowCount: 0,
      invalidRowCount: 0,
      duplicateRowCount: 0,
      issueCounts: {},
      uploadedById: numericUser(auth.user.id),
      confirmedAt: null,
      savedCount: null,
      skippedCount: null,
      createdAt: new Date().toISOString(),
    };
    imports.set(id, {
      org: auth.user.organization_id,
      uploader: auth.user.id,
      data,
      rows: new Map(),
      issues: [],
      checked: [],
    });
    return { status: 201, data };
  },

  'POST /movement-imports/:id/rows': ({ params, body }) => {
    const { state, error: failure } = load(params.id, true);
    if (failure) return failure;
    if (state.data.status === 'CONFIRMED') {
      return error(409, 'IMPORT_CONFIRMED', 'The import is already confirmed');
    }
    const rows = (body as { rows?: unknown })?.rows;
    if (!Array.isArray(rows) || rows.length < 1 || rows.length > IMPORT_LIMITS.maxRowsPerBatch) {
      return { status: 400, data: { statusCode: 400, message: ['rows must hold 1 to 2000 rows'] } };
    }
    const allowed = new Set<string>(TEMPLATE_COLUMNS);
    const problems = (rows as ImportRow[]).flatMap((row, index) => {
      if (!Number.isInteger(row?.rowNumber) || row.rowNumber < 2)
        return [`rows[${index}]: rowNumber`];
      const keys = Object.keys(row.values ?? {});
      const unknown = keys.find((key) => !allowed.has(key));
      return unknown ? [`rows[${index}]: unknown column "${unknown}"`] : [];
    });
    if (problems.length > 0) {
      return {
        status: 400,
        data: {
          statusCode: 400,
          code: 'ROWS_INVALID',
          message: 'Some rows are not in the template format',
          problems,
        },
      };
    }
    for (const row of rows as ImportRow[]) state.rows.set(row.rowNumber, row);
    if (state.rows.size > IMPORT_LIMITS.maxRows) {
      return error(413, 'TOO_MANY_ROWS', 'An import holds at most 200000 rows');
    }
    state.data = { ...state.data, status: 'RECEIVING', rowCount: state.rows.size };
    return { status: 200, data: { received: rows.length, import: state.data } };
  },

  'POST /movement-imports/:id/validate': ({ params }) => {
    const { state, error: failure } = load(params.id, true);
    if (failure) return failure;
    if (state.data.status === 'CONFIRMED') {
      return error(409, 'IMPORT_CONFIRMED', 'The import is already confirmed');
    }
    if (state.rows.size === 0) return error(409, 'IMPORT_EMPTY', 'Send the rows before validating');
    validate(state);
    return { status: 200, data: report(state, {}) };
  },

  'POST /movement-imports/:id/confirm': ({ params, body }) => {
    const { state, error: failure } = load(params.id, true);
    if (failure) return failure;
    if (state.data.status === 'CONFIRMED') return { status: 200, data: state.data };
    if (state.data.status !== 'VALIDATED') {
      return error(409, 'IMPORT_NOT_VALIDATED', 'Validate the import before confirming it');
    }
    if ((body as { revision?: number })?.revision !== state.data.revision) {
      return error(
        409,
        'IMPORT_STALE',
        'The import or the history changed since it was validated; validate it again',
      );
    }
    const valid = state.checked.filter((r) => r.status === 'VALID');
    if (valid.length === 0)
      return error(409, 'IMPORT_NOTHING_VALID', 'The import has no valid row to save');
    let savedCount = 0;
    let skipped = 0;
    for (const checked of valid) {
      const key = lineKey(state.org, state.data.sourceNamespace, checked.row.values);
      if (history.has(key)) {
        skipped++;
      } else {
        history.set(key, content(checked.row.values));
        saved.push({
          id: saved.length + 1,
          org: state.org,
          importId: state.data.id,
          namespace: state.data.sourceNamespace,
          checked,
        });
        savedCount++;
      }
    }
    state.data = {
      ...state.data,
      status: 'CONFIRMED',
      confirmedAt: new Date().toISOString(),
      savedCount,
      skippedCount: skipped,
    };
    return { status: 200, data: state.data };
  },

  'GET /movement-imports/:id': ({ params, query }) => {
    const { state, error: failure } = load(params.id, false);
    if (failure) return failure;
    return { status: 200, data: report(state, query) };
  },

  'GET /movement-imports/:id/balances': ({ params, query }) => {
    const { state, error: failure } = load(params.id, false);
    if (failure) return failure;
    return { status: 200, data: page(balances(state), query) };
  },

  /** The imported history, newest first (no cutover here: `afterCutover` is always false). */
  'GET /historical-movements': ({ query }) => {
    const auth = authorize('movement.read');
    if (auth.error) return auth.error;
    const org = auth.user.organization_id;
    const products = new Map(productsOf(org).map((p) => [p.id, p]));
    const warehouses = new Map(activeWarehousesOf(org).map((w) => [w.id, w]));
    const number = (value: string | null) => (value === null ? null : Number(value));
    const items = saved
      .filter(({ org: lineOrg, importId, checked }) => {
        const code = text(checked.row.values.movement_type)?.toUpperCase();
        return (
          lineOrg === org &&
          (!query.productId || checked.productId === Number(query.productId)) &&
          (!query.warehouseId || checked.warehouseId === Number(query.warehouseId)) &&
          (!query.importId || importId === Number(query.importId)) &&
          (!query.movementType || code === query.movementType) &&
          (!query.from || (checked.date ?? '') >= query.from) &&
          (!query.to || (checked.date ?? '') <= query.to)
        );
      })
      .sort((a, b) => (b.checked.date ?? '').localeCompare(a.checked.date ?? '') || b.id - a.id)
      .flatMap(({ id, importId, namespace, checked }) => {
        const product = products.get(checked.productId ?? -1);
        const warehouse = warehouses.get(checked.warehouseId ?? -1);
        if (!product || !warehouse) return [];
        const v = checked.row.values;
        return [
          {
            id,
            date: checked.date,
            movementType: text(v.movement_type)?.toUpperCase(),
            product: {
              id: product.id,
              sku: product.sku,
              name: product.name,
              unit: findUnitRow(product.stockUnitId)?.code ?? 'EA',
            },
            warehouse: { id: warehouse.id, code: warehouse.code, name: warehouse.name },
            quantityIn: checked.side === 'IN' ? checked.quantity : null,
            quantityOut: checked.side === 'OUT' ? checked.quantity : null,
            balance: checked.balance,
            documentRef: text(v.document_ref),
            locationCode: text(v.location_code) ?? 'DEFAULT',
            lotCode: text(v.lot_code),
            unitCost: number(text(v.unit_cost)),
            afterCutover: false,
            source: {
              importId,
              sourceNamespace: namespace,
              externalMovementId: text(v.external_movement_id),
              lineNumber: Number(text(v.line_number)),
            },
          },
        ];
      });
    return { status: 200, data: page(items, query) };
  },
};
