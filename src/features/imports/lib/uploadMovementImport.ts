import {
  appendImportRows,
  createMovementImport,
  validateMovementImport,
} from '../api/movementImports.api';
import {
  IMPORT_LIMITS,
  type ImportRow,
  type MovementImportReport,
} from '../types/movementImports.types';
import { chunk } from './movementTemplate';

export interface UploadProgress {
  phase: 'sending' | 'validating';
  sent: number;
  total: number;
}

export interface UploadInput {
  /** An import started earlier for the same file and source: its rows are replaced, not added. */
  importId: number | null;
  sourceNamespace: string;
  fileName: string;
  rows: ImportRow[];
  onProgress?: (progress: UploadProgress) => void;
}

export class TooManyRowsError extends Error {}

/**
 * Sends the rows to the API and validates them: starts the import (unless one is given), sends
 * the rows in batches of 2,000, one after the other, and asks for the validation. Sending a row
 * number again replaces that row, so repeating this after a failure is safe.
 */
export async function uploadMovementImport({
  importId,
  sourceNamespace,
  fileName,
  rows,
  onProgress,
}: UploadInput): Promise<MovementImportReport> {
  if (rows.length > IMPORT_LIMITS.maxRows) throw new TooManyRowsError();

  const id = importId ?? (await createMovementImport({ sourceNamespace, fileName })).id;
  let sent = 0;
  onProgress?.({ phase: 'sending', sent, total: rows.length });
  for (const batch of chunk(rows, IMPORT_LIMITS.maxRowsPerBatch)) {
    await appendImportRows(id, batch);
    sent += batch.length;
    onProgress?.({ phase: 'sending', sent, total: rows.length });
  }
  onProgress?.({ phase: 'validating', sent, total: rows.length });
  return validateMovementImport(id);
}
