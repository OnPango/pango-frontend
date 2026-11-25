import { isAxiosError } from 'axios';
import {
  appendInventoryRows,
  createInventoryImport,
  validateInventoryImport,
} from '../api/inventoryImports.api';
import {
  INVENTORY_SCHEMA_VERSION,
  type InventoryImportLimits,
  type InventoryImportReport,
  type InventoryMapping,
  type InventoryRow,
} from '../types/inventoryImports.types';

export interface InventoryUploadProgress {
  phase: 'sending' | 'validating';
  sent: number;
  total: number;
}

/** The file has more rows than one import takes. */
export class TooManyRowsError extends Error {
  readonly rows: number;
  readonly max: number;

  constructor(rows: number, max: number) {
    super(`${rows} rows, at most ${max}`);
    this.rows = rows;
    this.max = max;
  }
}

/** Rows whose text is longer than the API takes: it would refuse their whole batch. */
export class OversizedRowsError extends Error {
  readonly rowNumbers: number[];

  constructor(rowNumbers: number[]) {
    super(`Rows over the size limit: ${rowNumbers.join(', ')}`);
    this.rowNumbers = rowNumbers;
  }
}

/** Space left in a batch for the `{"batchNumber":…,"rows":[…]}` wrapper. */
const BODY_OVERHEAD_BYTES = 64;
/** Batches fill up to this share of the API's body limit. */
const BODY_MARGIN = 0.9;

const encoder = new TextEncoder();
const byteLength = (value: unknown) => encoder.encode(JSON.stringify(value)).length;

/**
 * Splits the rows in consecutive batches whose JSON body stays under the API's limit (with a
 * margin) and that hold at most `maxRowsPerBatch` rows. A row alone above the limit gets its own
 * batch: the API then reports it.
 */
export function splitBatches(rows: readonly InventoryRow[], limits: InventoryImportLimits) {
  const maxBytes = limits.maxRequestBytes * BODY_MARGIN;
  const batches: InventoryRow[][] = [];
  let current: InventoryRow[] = [];
  let bytes = BODY_OVERHEAD_BYTES;
  for (const row of rows) {
    const size = byteLength(row) + 1; // the comma between rows
    if (
      current.length > 0 &&
      (current.length >= limits.maxRowsPerBatch || bytes + size > maxBytes)
    ) {
      batches.push(current);
      current = [];
      bytes = BODY_OVERHEAD_BYTES;
    }
    current.push(row);
    bytes += size;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

/** Rows with a value longer than `maxValueChars`, or values adding up to more than `maxRowChars`. */
export function oversizedRows(rows: readonly InventoryRow[], limits: InventoryImportLimits) {
  return rows
    .filter((row) => {
      const values = Object.values(row.values).filter((v): v is string => typeof v === 'string');
      const total = values.reduce((sum, v) => sum + v.length, 0);
      return total > limits.maxRowChars || values.some((v) => v.length > limits.maxValueChars);
    })
    .map((row) => row.rowNumber);
}

/** No answer, or a server failure (5xx, `IMPORT_BUSY` included): nothing was saved. */
export function isRetryable(error: unknown): boolean {
  return isAxiosError(error) && (!error.response || error.response.status >= 500);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs `call` again after a network failure or a 5xx, waiting 1, 2 and 4 seconds: every route of
 * the inventory import is safe to repeat (a batch sent twice is stored once).
 */
export async function withRetry<T>(
  call: () => Promise<T>,
  {
    attempts = 4,
    sleep = wait,
  }: { attempts?: number; sleep?: (ms: number) => Promise<unknown> } = {},
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await call();
    } catch (error) {
      if (attempt >= attempts || !isRetryable(error)) throw error;
      await sleep(1000 * 2 ** (attempt - 1));
    }
  }
}

export interface InventoryUploadInput {
  /** An import already started for this same file and mapping: its batches are sent again. */
  importId: number | null;
  /** Generated once per file and mapping, so a repeated creation answers the same import. */
  clientRequestId: string;
  fileName: string;
  sheetName: string;
  mapping: InventoryMapping;
  rows: InventoryRow[];
  limits: InventoryImportLimits;
  onCreated?: (importId: number) => void;
  onProgress?: (progress: InventoryUploadProgress) => void;
  sleep?: (ms: number) => Promise<unknown>;
}

/**
 * Sends a file's rows and validates them: starts the import (unless one is given), sends the
 * batches one after the other, numbered from 1, and asks for the validation once every row is in.
 * Every step is safe to repeat, so a failed upload can simply be run again.
 */
export async function uploadInventoryImport({
  importId,
  clientRequestId,
  fileName,
  sheetName,
  mapping,
  rows,
  limits,
  onCreated,
  onProgress,
  sleep,
}: InventoryUploadInput): Promise<InventoryImportReport> {
  if (rows.length > limits.maxRowsPerImport) {
    throw new TooManyRowsError(rows.length, limits.maxRowsPerImport);
  }
  const oversized = oversizedRows(rows, limits);
  if (oversized.length > 0) throw new OversizedRowsError(oversized);

  const retry = <T>(call: () => Promise<T>) => withRetry(call, { sleep });
  const id =
    importId ??
    (
      await retry(() =>
        createInventoryImport({
          clientRequestId,
          schemaVersion: INVENTORY_SCHEMA_VERSION,
          fileName,
          sheetName,
          totalRows: rows.length,
          mapping,
        }),
      )
    ).id;
  onCreated?.(id);

  let sent = 0;
  onProgress?.({ phase: 'sending', sent, total: rows.length });
  for (const [index, batch] of splitBatches(rows, limits).entries()) {
    await retry(() => appendInventoryRows(id, index + 1, batch));
    sent += batch.length;
    onProgress?.({ phase: 'sending', sent, total: rows.length });
  }
  onProgress?.({ phase: 'validating', sent, total: rows.length });
  return retry(() => validateInventoryImport(id));
}
