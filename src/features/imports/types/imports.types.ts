/** What a load brings: today's stock or past movements. */
export type ImportKind = 'inventory' | 'movements';

export const IMPORT_KINDS: ImportKind[] = ['inventory', 'movements'];

export type ImportStatus = 'COMPLETED' | 'PARTIAL' | 'FAILED';

/** One row of "Cargas anteriores". */
export interface ImportRecord {
  id: string;
  kind: ImportKind;
  date: string;
  fileName: string;
  rowsLoaded: number;
  rowsSkipped: number | null;
  status: ImportStatus;
  userName: string;
}

export interface ImportFile {
  name: string;
  sizeKb: number;
  rows: number;
  columns: number;
  sheets: string[];
  /** The file follows Pango's template, so every column is joined by name. */
  isTemplate: boolean;
}

/** A datum Pango needs, and the column of the file that carries it. */
export interface MappingField {
  key: string;
  label: string;
  required: boolean;
  /** Extra hint under the label ("si el seguimiento es Lote"). */
  hint?: string;
  example: string;
  /** Column the analysis matched by name, if any. */
  column: string | null;
}

export interface ImportAnalysis {
  uploadId: string;
  file: ImportFile;
  /** Every header of the file, for the column pickers. */
  headers: string[];
  fields: MappingField[];
  /** Sentence under "Ver los datos opcionales". */
  optionalSummary: string | null;
  optionalCount: number;
}

export type RowResult = 'VALID' | 'NO_CHANGE' | 'NEW' | 'ERROR';

export interface PreviewRow {
  /** Cells in the order of the preview columns. */
  cells: string[];
  result: RowResult;
  /** Why the row is left out (only for errors) or what happens to it. */
  note: string;
}

export interface PreviewColumn {
  key: string;
  label: string;
  numeric?: boolean;
}

export type PreviewFilter = 'all' | 'valid' | 'changed' | 'new' | 'different' | 'errors';

export interface PreviewCreations {
  products: number;
  categories: number;
  warehouses: number;
  lots: number;
}

export type ConflictSubject = 'PRODUCT' | 'WAREHOUSE';
export type Resolution = 'PANGO' | 'FILE';

export interface ConflictItem {
  id: string;
  subject: ConflictSubject;
  name: string;
  code: string;
  field: string;
  inPango: string;
  inFile: string;
  /** The unit cannot change from a load. */
  locked: boolean;
}

export interface ImportPreview {
  validRows: number;
  errorRows: number;
  columns: PreviewColumn[];
  rows: PreviewRow[];
  shownRows: number;
  totalRows: number;
  /** Inventory only. */
  stockChanges: number | null;
  creations: PreviewCreations | null;
  conflictRecords: number;
  conflictFields: number;
  conflicts: ConflictItem[];
  /** Movements only. */
  products: number | null;
  period: string | null;
  /** Inventory only: adjustments, split by direction, and how many are big. */
  adjustments: { up: number; down: number; large: number } | null;
  warehouses: number | null;
  errorReasons: { reason: string; rows: number; fix: string }[];
}

export interface ConfirmInput {
  resolutions: Record<string, Resolution>;
  requireApproval: boolean;
}

export type ProcessingStepId = 'READ' | 'VALIDATED' | 'SAVING' | 'ALERTS';

export interface ImportRun {
  id: string;
  state: 'PROCESSING' | 'DONE' | 'PARTIAL' | 'FAILED';
  /** 0 to 100. */
  progress: number;
  /** Steps already finished. */
  doneSteps: ProcessingStepId[];
  summary: {
    rowsLoaded: number;
    rowsSkipped: number;
    products: number;
    newProducts: number;
    adjustments: number;
    pendingApproval: number;
    movements: number;
  } | null;
}

export type DataQuality = 'GOOD' | 'REGULAR' | 'LOW';

export interface QualityRow {
  productId: string;
  name: string;
  code: string;
  monthsWithData: number;
  gaps: number;
  quality: DataQuality;
}

export interface QualitySummary {
  good: number;
  regular: number;
  low: number;
  rows: QualityRow[];
}
