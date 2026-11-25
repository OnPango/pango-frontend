/**
 * The movement history import of pango-core (`/movement-imports`, CU-17). The browser reads the
 * company's file, maps its columns onto the v1 template and sends the rows as JSON; the API never
 * receives the file. Shapes mirror `src/movement-imports/responses.ts` of pango-core.
 */

/** Template v1 columns, in the template's order. */
export const TEMPLATE_COLUMNS = [
  'external_movement_id',
  'line_number',
  'business_date',
  'warehouse_code',
  'sku',
  'stock_unit',
  'movement_type',
  'quantity_in',
  'quantity_out',
  'balance_after',
  'document_ref',
  'location_code',
  'lot_code',
  'unit_cost',
] as const;

export type TemplateColumn = (typeof TEMPLATE_COLUMNS)[number];

/** Movement codes the template accepts in `movement_type`. */
export const MOVEMENT_CODES = [
  'OPENING_BALANCE',
  'PURCHASE_RECEIPT',
  'SALE',
  'INTERNAL_CONSUMPTION',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
  'TRANSFER_OUT',
  'TRANSFER_IN',
] as const;

export type MovementCode = (typeof MOVEMENT_CODES)[number];

/** Limits of the API: rows per request and per import, characters of one sent value. */
export const IMPORT_LIMITS = {
  maxRowsPerBatch: 2000,
  maxRows: 200_000,
  maxValueChars: 1000,
} as const;

/** One row as sent: its row in the user's file (the header is row 1) and its template values. */
export interface ImportRow {
  rowNumber: number;
  values: Record<TemplateColumn, string | null>;
}

export type MovementImportStatus = 'RECEIVING' | 'VALIDATED' | 'CONFIRMED';

export interface MovementImport {
  id: number;
  sourceNamespace: string;
  fileName: string | null;
  status: MovementImportStatus;
  /** Bumped by every validation; the confirmation names the one reviewed. */
  revision: number;
  rowCount: number;
  validRowCount: number;
  invalidRowCount: number;
  /** Repeats of an earlier row, or lines already in the history: counted once. */
  duplicateRowCount: number;
  /** Every issue of the last validation, by code. */
  issueCounts: Record<string, number>;
  uploadedById: number;
  confirmedAt: string | null;
  /** Lines saved into the history by the confirmation. */
  savedCount: number | null;
  /** Valid lines another import had already saved. */
  skippedCount: number | null;
  createdAt: string;
}

export type IssueSeverity = 'ERROR' | 'WARNING';

export interface ImportIssue {
  rowNumber: number | null;
  field: string | null;
  severity: IssueSeverity;
  code: string;
  message: string;
  value: string | null;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** An import and a page of the issues of its last validation. */
export interface MovementImportReport {
  import: MovementImport;
  issues: Page<ImportIssue>;
}

export interface AppendRowsResult {
  received: number;
  import: MovementImport;
}

/** Per product and warehouse: valid rows, closing balance the file gives and its demand. */
export interface ImportBalance {
  product: { id: number; sku: string; name: string; unit: string };
  warehouse: { id: number; code: string; name: string };
  rows: number;
  /** Null when the file sets no starting balance for the pair. */
  closing: number | null;
  demand: number;
}

export interface IssuesQuery {
  page?: number;
  pageSize?: number;
  severity?: IssueSeverity;
  code?: string;
}
