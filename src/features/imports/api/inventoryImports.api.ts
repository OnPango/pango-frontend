import { http } from '@/core/api/http';
import type {
  AppendInventoryRowsResult,
  InventoryImport,
  InventoryImportFields,
  InventoryImportIssue,
  InventoryImportReport,
  InventoryImportStatus,
  InventoryMapping,
  InventoryPreviewRow,
  InventoryRow,
  IssuesQuery,
  PageQuery,
  PreviewRowsQuery,
  RevisionPage,
} from '../types/inventoryImports.types';

/**
 * The API confirms within 120 s by default (`INVENTORY_IMPORT_CONFIRM_TIMEOUT_MS`) and validation
 * well below it: wait longer than that before giving up, instead of the client's default 15 s.
 */
const LONG_TIMEOUT_MS = 180_000;

const BASE = '/inventory-imports';

/** `GET /inventory-imports/fields`: the field dictionary, the units and the configured limits. */
export async function getInventoryImportFields(): Promise<InventoryImportFields> {
  const { data } = await http.get<InventoryImportFields>(`${BASE}/fields`);
  return data;
}

export interface CreateInventoryImportInput {
  /** One per file: repeating the same request answers the same import. */
  clientRequestId: string;
  schemaVersion: number;
  fileName: string;
  sheetName: string;
  totalRows: number;
  mapping: InventoryMapping;
}

/** `POST /inventory-imports`: starts an import. An organization has one open at a time. */
export async function createInventoryImport(
  input: CreateInventoryImportInput,
): Promise<InventoryImport> {
  const { data } = await http.post<InventoryImport>(BASE, input);
  return data;
}

/** `POST /inventory-imports/:id/rows`: one batch. The same batch sent again changes nothing. */
export async function appendInventoryRows(
  id: number,
  batchNumber: number,
  rows: InventoryRow[],
): Promise<AppendInventoryRowsResult> {
  const { data } = await http.post<AppendInventoryRowsResult>(`${BASE}/${id}/rows`, {
    batchNumber,
    rows,
  });
  return data;
}

/** `POST /inventory-imports/:id/validate`: checks every row; answers a new `revision`. */
export async function validateInventoryImport(id: number): Promise<InventoryImportReport> {
  const { data } = await http.post<InventoryImportReport>(`${BASE}/${id}/validate`, undefined, {
    timeout: LONG_TIMEOUT_MS,
  });
  return data;
}

/** `POST /inventory-imports/:id/confirm`: writes the reviewed `revision`. Repeating it is safe. */
export async function confirmInventoryImport(
  id: number,
  revision: number,
): Promise<InventoryImport> {
  const { data } = await http.post<InventoryImport>(
    `${BASE}/${id}/confirm`,
    { revision },
    { timeout: LONG_TIMEOUT_MS },
  );
  return data;
}

/** `POST /inventory-imports/:id/cancel`: closes an open import. Repeating it is safe. */
export async function cancelInventoryImport(id: number): Promise<InventoryImport> {
  const { data } = await http.post<InventoryImport>(`${BASE}/${id}/cancel`);
  return data;
}

/** `GET /inventory-imports/:id`: the import, with its summary and result. */
export async function getInventoryImport(id: number): Promise<InventoryImport> {
  const { data } = await http.get<InventoryImport>(`${BASE}/${id}`);
  return data;
}

/** `GET /inventory-imports`: the imports the user may see, newest first. */
export async function listInventoryImports(
  query: PageQuery & { status?: InventoryImportStatus } = {},
): Promise<{ items: InventoryImport[]; total: number; page: number; pageSize: number }> {
  const { data } = await http.get<{
    items: InventoryImport[];
    total: number;
    page: number;
    pageSize: number;
  }>(BASE, { params: query });
  return data;
}

/** `GET /inventory-imports/:id/rows`: a page of the preview rows of the last validation. */
export async function getInventoryImportRows(
  id: number,
  query: PreviewRowsQuery = {},
): Promise<RevisionPage<InventoryPreviewRow>> {
  const { data } = await http.get<RevisionPage<InventoryPreviewRow>>(`${BASE}/${id}/rows`, {
    params: query,
  });
  return data;
}

/** `GET /inventory-imports/:id/issues`: a page of the issues of the last validation. */
export async function getInventoryImportIssues(
  id: number,
  query: IssuesQuery = {},
): Promise<RevisionPage<InventoryImportIssue>> {
  const { data } = await http.get<RevisionPage<InventoryImportIssue>>(`${BASE}/${id}/issues`, {
    params: query,
  });
  return data;
}
