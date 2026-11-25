/**
 * The inventory import of pango-core (`/inventory-imports`): the opening stock of a company. The
 * browser reads the workbook, maps its columns onto the field dictionary and sends the rows as
 * text; the API checks every value. Shapes mirror `docs/modules/inventary.md` of pango-core.
 */

/** The field dictionary, in the template's column order (A–U). */
export const INVENTORY_FIELD_KEYS = [
  'sku',
  'name',
  'category',
  'stockUnit',
  'warehouse',
  'tracksLots',
  'stockQuantity',
  'unitCost',
  'lotCode',
  'locationCode',
  'manufactureDate',
  'expiryDate',
  'warehouseType',
  'warehouseCode',
  'warehouseAddress',
  'description',
  'lengthCm',
  'widthCm',
  'heightCm',
  'weightKg',
  'volumeL',
] as const;

export type InventoryFieldKey = (typeof INVENTORY_FIELD_KEYS)[number];

/** The template schema the API takes in `schemaVersion`. */
export const INVENTORY_SCHEMA_VERSION = 1;

/** One row as sent: its row in the user's file (the header is row 1) and its values as text. */
export interface InventoryRow {
  rowNumber: number;
  values: Partial<Record<InventoryFieldKey, string | null>>;
}

/** Which column of the file feeds a field: 1 = A, and the header as written. */
export interface MappedColumn {
  column: number;
  header: string;
}

/** The `mapping` of `POST /inventory-imports`; null = the field is not in the file. */
export type InventoryMapping = Record<InventoryFieldKey, MappedColumn | null>;

export type InventoryImportStatus =
  'RECEIVING' | 'READY' | 'INVALID' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

/** Open imports can still change; the others are final. */
export const OPEN_STATUSES: readonly InventoryImportStatus[] = ['RECEIVING', 'READY', 'INVALID'];

/** What exists (reuse) and what the confirmation would create, per kind of entity. */
export interface EntityCounts {
  products: number;
  categories: number;
  warehouses: number;
  lots: number;
}

/** Counts of the last validation. */
export interface InventoryImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  /** Rows that add stock: quantity above 0, not repeated. */
  stockRows: number;
  errors: number;
  warnings: number;
  issueCounts: Record<string, number>;
  create: EntityCounts;
  reuse: EntityCounts;
}

/** What the confirmation wrote. */
export interface InventoryImportResult {
  stockRows: number;
  movements: number;
  created: EntityCounts;
  /** Warehouses created by the import that its non-Owner creator was assigned to. */
  assignedWarehouses: number;
}

export interface InventoryImport {
  id: number;
  status: InventoryImportStatus;
  schemaVersion: number;
  fileName: string;
  sheetName: string;
  totalRows: number;
  receivedRows: number;
  /** Bumped by every validation; the confirmation names the one reviewed. */
  revision: number;
  summary: InventoryImportSummary | null;
  result: InventoryImportResult | null;
  createdBy: { id: number; name: string | null };
  createdAt: string;
  updatedAt: string;
  /** When an open import expires without activity; null once closed. */
  expiresAt: string | null;
  confirmedAt: string | null;
}

/** The limits the API is configured with (`GET /inventory-imports/fields`). */
export interface InventoryImportLimits {
  maxRowsPerBatch: number;
  maxRowsPerImport: number;
  /** Serialized UTF-8 size of a whole request body. */
  maxRequestBytes: number;
  maxValueChars: number;
  maxRowChars: number;
  expiryHours: number;
}

export interface InventoryImportFields {
  schemaVersion: number;
  limits: InventoryImportLimits;
  fields: { key: string; label: string; required: boolean }[];
  units: { code: string; name: string; aliases: string[] }[];
}

export interface AppendInventoryRowsResult {
  importId: number;
  batchNumber: number;
  acceptedRows: number;
  receivedRows: number;
  totalRows: number;
  status: InventoryImportStatus;
  /** The batch had already been received: nothing changed. */
  replayed: boolean;
}

export type IssueSeverity = 'ERROR' | 'WARNING';

export interface InventoryImportIssue {
  /** Row of the file; null for an issue of the whole import. */
  rowNumber: number | null;
  field: InventoryFieldKey | null;
  sourceColumn: MappedColumn | null;
  severity: IssueSeverity;
  code: string;
  /** English, safe to show when the code has no Spanish text. */
  message: string;
  value: string | null;
}

/** A page of a validation: `revision` says which one it comes from. */
export interface RevisionPage<T> {
  revision: number;
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InventoryImportReport {
  import: InventoryImport;
  issues: RevisionPage<InventoryImportIssue>;
}

export type PreviewRowStatus = 'PENDING' | 'VALID' | 'INVALID' | 'DUPLICATE';

/** An entity a row resolves to; `id` is null when the confirmation would create it. */
export interface PreviewEntity {
  id: number | null;
  name: string | null;
  isNew: boolean;
}

/** One row of the preview: what it resolves to, and whether each entity is new. */
export interface InventoryPreviewRow {
  rowNumber: number;
  status: PreviewRowStatus;
  sku: string | null;
  product: PreviewEntity | null;
  category: PreviewEntity | null;
  warehouse: (PreviewEntity & { code: string | null }) | null;
  locationCode: string | null;
  lot: { id: number | null; code: string; isNew: boolean } | null;
  stockUnit: string | null;
  /** Exact digits, as text. */
  quantity: string | null;
  unitCost: string | null;
  issues: number;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

export interface IssuesQuery extends PageQuery {
  severity?: IssueSeverity;
  code?: string;
}

export interface PreviewRowsQuery extends PageQuery {
  status?: Exclude<PreviewRowStatus, 'PENDING'>;
}
