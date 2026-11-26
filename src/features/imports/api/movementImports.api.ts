import { http } from '@/core/api/http';
import type {
  AppendRowsResult,
  ImportBalance,
  ImportRow,
  IssuesQuery,
  MovementImport,
  MovementImportReport,
  Page,
} from '../types/movementImports.types';

/**
 * Validating or confirming checks every row of the import (up to 200,000) in one request: more
 * than the client's default 15 s may pass.
 */
const LONG_TIMEOUT_MS = 180_000;

/** `POST /movement-imports`: starts an import. `sourceNamespace` names the system the ids come from. */
export async function createMovementImport(input: {
  sourceNamespace: string;
  fileName?: string;
}): Promise<MovementImport> {
  const { data } = await http.post<MovementImport>('/movement-imports', input);
  return data;
}

/** `POST /movement-imports/:id/rows`: one batch of up to 2,000 rows. A row sent again replaces it. */
export async function appendImportRows(id: number, rows: ImportRow[]): Promise<AppendRowsResult> {
  const { data } = await http.post<AppendRowsResult>(`/movement-imports/${id}/rows`, { rows });
  return data;
}

/** `POST /movement-imports/:id/validate`: checks every row; answers a new `revision` and the issues. */
export async function validateMovementImport(id: number): Promise<MovementImportReport> {
  const { data } = await http.post<MovementImportReport>(
    `/movement-imports/${id}/validate`,
    undefined,
    { timeout: LONG_TIMEOUT_MS },
  );
  return data;
}

/** `POST /movement-imports/:id/confirm`: saves the valid rows of the validated `revision`. */
export async function confirmMovementImport(id: number, revision: number): Promise<MovementImport> {
  const { data } = await http.post<MovementImport>(
    `/movement-imports/${id}/confirm`,
    { revision },
    { timeout: LONG_TIMEOUT_MS },
  );
  return data;
}

/** `GET /movement-imports/:id`: the import and a page of its issues, filtered. */
export async function getMovementImportReport(
  id: number,
  query: IssuesQuery = {},
): Promise<MovementImportReport> {
  const { data } = await http.get<MovementImportReport>(`/movement-imports/${id}`, {
    params: query,
  });
  return data;
}

/** `GET /movement-imports/:id/balances`: per product and warehouse, rows, closing and demand. */
export async function getMovementImportBalances(
  id: number,
  query: { page?: number; pageSize?: number } = {},
): Promise<Page<ImportBalance>> {
  const { data } = await http.get<Page<ImportBalance>>(`/movement-imports/${id}/balances`, {
    params: query,
  });
  return data;
}
