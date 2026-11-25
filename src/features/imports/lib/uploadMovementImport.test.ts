import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  appendImportRows,
  createMovementImport,
  validateMovementImport,
} from '../api/movementImports.api';
import type { ImportRow, MovementImportReport } from '../types/movementImports.types';
import {
  TooManyRowsError,
  uploadMovementImport,
  type UploadProgress,
} from './uploadMovementImport';

vi.mock('../api/movementImports.api', () => ({
  createMovementImport: vi.fn(),
  appendImportRows: vi.fn(),
  validateMovementImport: vi.fn(),
}));

const rows = (count: number): ImportRow[] =>
  Array.from({ length: count }, (_, i) => ({
    rowNumber: i + 2,
    values: {} as ImportRow['values'],
  }));

const report = { import: { id: 7, revision: 1 } } as MovementImportReport;

beforeEach(() => {
  vi.mocked(createMovementImport)
    .mockReset()
    .mockResolvedValue({ id: 7 } as never);
  vi.mocked(appendImportRows)
    .mockReset()
    .mockResolvedValue({} as never);
  vi.mocked(validateMovementImport).mockReset().mockResolvedValue(report);
});

describe('uploadMovementImport', () => {
  it('starts an import, sends the rows in batches of 2,000 in order and validates', async () => {
    const progress: UploadProgress[] = [];
    const result = await uploadMovementImport({
      importId: null,
      sourceNamespace: 'siigo-main',
      fileName: 'kardex.xlsx',
      rows: rows(4500),
      onProgress: (p) => progress.push(p),
    });

    expect(createMovementImport).toHaveBeenCalledWith({
      sourceNamespace: 'siigo-main',
      fileName: 'kardex.xlsx',
    });
    const batches = vi.mocked(appendImportRows).mock.calls;
    expect(batches.map(([id, batch]) => [id, batch.length, batch[0].rowNumber])).toEqual([
      [7, 2000, 2],
      [7, 2000, 2002],
      [7, 500, 4002],
    ]);
    expect(validateMovementImport).toHaveBeenCalledWith(7);
    expect(result).toBe(report);
    expect(progress).toEqual([
      { phase: 'sending', sent: 0, total: 4500 },
      { phase: 'sending', sent: 2000, total: 4500 },
      { phase: 'sending', sent: 4000, total: 4500 },
      { phase: 'sending', sent: 4500, total: 4500 },
      { phase: 'validating', sent: 4500, total: 4500 },
    ]);
  });

  it('sends the rows again to the import already started for the same file', async () => {
    await uploadMovementImport({
      importId: 3,
      sourceNamespace: 'x',
      fileName: 'a.csv',
      rows: rows(2),
    });
    expect(createMovementImport).not.toHaveBeenCalled();
    expect(appendImportRows).toHaveBeenCalledWith(3, rows(2));
    expect(validateMovementImport).toHaveBeenCalledWith(3);
  });

  it('does not validate when a batch fails', async () => {
    vi.mocked(appendImportRows)
      .mockResolvedValueOnce({} as never)
      .mockRejectedValueOnce(new Error('network'));
    await expect(
      uploadMovementImport({
        importId: null,
        sourceNamespace: 'x',
        fileName: 'a.csv',
        rows: rows(3000),
      }),
    ).rejects.toThrow('network');
    expect(validateMovementImport).not.toHaveBeenCalled();
  });

  it('refuses more than 200,000 rows before sending anything', async () => {
    await expect(
      uploadMovementImport({
        importId: null,
        sourceNamespace: 'x',
        fileName: 'a.csv',
        rows: rows(200_001),
      }),
    ).rejects.toBeInstanceOf(TooManyRowsError);
    expect(createMovementImport).not.toHaveBeenCalled();
  });
});
