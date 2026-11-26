import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  appendInventoryRows,
  createInventoryImport,
  validateInventoryImport,
} from '../api/inventoryImports.api';
import type {
  InventoryImportLimits,
  InventoryImportReport,
  InventoryMapping,
  InventoryRow,
} from '../types/inventoryImports.types';
import {
  isRetryable,
  OversizedRowsError,
  oversizedRows,
  splitBatches,
  TooManyRowsError,
  uploadInventoryImport,
  withRetry,
  type InventoryUploadProgress,
} from './uploadInventoryImport';

vi.mock('../api/inventoryImports.api', () => ({
  createInventoryImport: vi.fn(),
  appendInventoryRows: vi.fn(),
  validateInventoryImport: vi.fn(),
}));

const LIMITS: InventoryImportLimits = {
  maxRowsPerBatch: 5000,
  maxRowsPerImport: 5000,
  maxRequestBytes: 1_048_576,
  maxValueChars: 2000,
  maxRowChars: 4096,
  expiryHours: 24,
};

const rows = (count: number, name = 'Tornillo'): InventoryRow[] =>
  Array.from({ length: count }, (_, i) => ({
    rowNumber: i + 2,
    values: { sku: `SKU-${i}`, name, stockQuantity: '1' },
  }));

/** An axios failure: with `status`, the API answered; without it, nothing came back. */
const httpError = (status?: number, code?: string) =>
  new AxiosError(
    'failed',
    'ERR',
    undefined,
    undefined,
    status === undefined
      ? undefined
      : {
          status,
          statusText: '',
          headers: {},
          config: { headers: new AxiosHeaders() },
          data: { code },
        },
  );

const noSleep = () => Promise.resolve();

describe('splitBatches', () => {
  it('keeps every body under the limit with a margin, in order', () => {
    const all = rows(3000, 'x'.repeat(500));
    const limits = { ...LIMITS, maxRequestBytes: 200_000 };
    const batches = splitBatches(all, limits);
    expect(batches.length).toBeGreaterThan(1);
    expect(batches.flat()).toEqual(all);
    for (const [i, batch] of batches.entries()) {
      const body = JSON.stringify({ batchNumber: i + 1, rows: batch });
      expect(new TextEncoder().encode(body).length).toBeLessThanOrEqual(200_000 * 0.9);
    }
  });

  it('measures bytes, not characters: accents weigh two', () => {
    const accented = rows(400, 'ñ'.repeat(200));
    const plain = rows(400, 'n'.repeat(200));
    const limits = { ...LIMITS, maxRequestBytes: 100_000 };
    expect(splitBatches(accented, limits).length).toBeGreaterThan(
      splitBatches(plain, limits).length,
    );
  });

  it('respects the rows per batch', () => {
    const batches = splitBatches(rows(25), { ...LIMITS, maxRowsPerBatch: 10 });
    expect(batches.map((b) => b.length)).toEqual([10, 10, 5]);
  });
});

describe('oversizedRows', () => {
  it('finds a value over its limit and a row over its total', () => {
    const list: InventoryRow[] = [
      { rowNumber: 2, values: { sku: 'A', description: 'x'.repeat(2001) } },
      {
        rowNumber: 3,
        values: {
          sku: 'B',
          name: 'y'.repeat(1500),
          description: 'z'.repeat(1500),
          category: 'w'.repeat(1500),
        },
      },
      { rowNumber: 4, values: { sku: 'C', name: null } },
    ];
    expect(oversizedRows(list, LIMITS)).toEqual([2, 3]);
  });
});

describe('withRetry', () => {
  it('repeats after no answer or a 5xx, waiting longer each time', async () => {
    const waits: number[] = [];
    const call = vi
      .fn()
      .mockRejectedValueOnce(httpError())
      .mockRejectedValueOnce(httpError(503, 'IMPORT_BUSY'))
      .mockResolvedValue('ok');
    await expect(withRetry(call, { sleep: async (ms) => void waits.push(ms) })).resolves.toBe('ok');
    expect(call).toHaveBeenCalledTimes(3);
    expect(waits).toEqual([1000, 2000]);
  });

  it('never repeats a refusal (4xx) and gives up after the last attempt', async () => {
    const refused = vi.fn().mockRejectedValue(httpError(409, 'BATCH_CONFLICT'));
    await expect(withRetry(refused, { sleep: noSleep })).rejects.toThrow();
    expect(refused).toHaveBeenCalledTimes(1);

    const down = vi.fn().mockRejectedValue(httpError(502));
    await expect(withRetry(down, { sleep: noSleep, attempts: 3 })).rejects.toThrow();
    expect(down).toHaveBeenCalledTimes(3);
    expect(isRetryable(new Error('not http'))).toBe(false);
  });
});

describe('uploadInventoryImport', () => {
  const report = { import: { id: 7, revision: 1 } } as InventoryImportReport;
  const base = {
    clientRequestId: '6f1c2d4e-8a7b-4c1d-9e2f-3a4b5c6d7e8f',
    fileName: 'inventario.xlsx',
    sheetName: 'Inventario',
    mapping: {} as InventoryMapping,
    limits: { ...LIMITS, maxRowsPerBatch: 2 },
    sleep: noSleep,
  };

  beforeEach(() => {
    vi.mocked(createInventoryImport)
      .mockReset()
      .mockResolvedValue({ id: 7 } as never);
    vi.mocked(appendInventoryRows)
      .mockReset()
      .mockResolvedValue({} as never);
    vi.mocked(validateInventoryImport).mockReset().mockResolvedValue(report);
  });

  it('starts the import, sends numbered batches in order and validates', async () => {
    const progress: InventoryUploadProgress[] = [];
    const created: number[] = [];
    const all = rows(5);
    const result = await uploadInventoryImport({
      ...base,
      importId: null,
      rows: all,
      onCreated: (id) => created.push(id),
      onProgress: (p) => progress.push(p),
    });

    expect(result).toBe(report);
    expect(createInventoryImport).toHaveBeenCalledWith({
      clientRequestId: base.clientRequestId,
      schemaVersion: 1,
      fileName: 'inventario.xlsx',
      sheetName: 'Inventario',
      totalRows: 5,
      mapping: base.mapping,
    });
    expect(created).toEqual([7]);
    expect(
      vi.mocked(appendInventoryRows).mock.calls.map(([id, n, b]) => [id, n, b.length]),
    ).toEqual([
      [7, 1, 2],
      [7, 2, 2],
      [7, 3, 1],
    ]);
    expect(validateInventoryImport).toHaveBeenCalledWith(7);
    expect(progress.at(-2)).toEqual({ phase: 'sending', sent: 5, total: 5 });
    expect(progress.at(-1)).toEqual({ phase: 'validating', sent: 5, total: 5 });
  });

  it('resends a failed batch with the same number and content', async () => {
    vi.mocked(appendInventoryRows)
      .mockRejectedValueOnce(httpError())
      .mockResolvedValue({} as never);
    await uploadInventoryImport({ ...base, importId: null, rows: rows(2) });
    const [first, second] = vi.mocked(appendInventoryRows).mock.calls;
    expect(second).toEqual(first);
  });

  it('continues an import already started instead of creating another', async () => {
    await uploadInventoryImport({ ...base, importId: 3, rows: rows(1) });
    expect(createInventoryImport).not.toHaveBeenCalled();
    expect(appendInventoryRows).toHaveBeenCalledWith(3, 1, expect.any(Array));
    expect(validateInventoryImport).toHaveBeenCalledWith(3);
  });

  it('refuses a file above the row limit or with oversized rows before sending anything', async () => {
    await expect(
      uploadInventoryImport({
        ...base,
        importId: null,
        rows: rows(6),
        limits: { ...LIMITS, maxRowsPerImport: 5 },
      }),
    ).rejects.toBeInstanceOf(TooManyRowsError);
    const long: InventoryRow[] = [{ rowNumber: 2, values: { description: 'x'.repeat(2001) } }];
    await expect(uploadInventoryImport({ ...base, importId: null, rows: long })).rejects.toEqual(
      new OversizedRowsError([2]),
    );
    expect(createInventoryImport).not.toHaveBeenCalled();
  });

  it('stops on a refusal: a conflicting batch is not resent', async () => {
    vi.mocked(appendInventoryRows).mockRejectedValue(httpError(409, 'BATCH_CONFLICT'));
    await expect(
      uploadInventoryImport({ ...base, importId: null, rows: rows(3) }),
    ).rejects.toThrow();
    expect(appendInventoryRows).toHaveBeenCalledTimes(1);
    expect(validateInventoryImport).not.toHaveBeenCalled();
  });
});
