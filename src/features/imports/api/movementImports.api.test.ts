import { afterEach, describe, expect, it, vi } from 'vitest';
import { http } from '@/core/api/http';
import type { ImportRow } from '../types/movementImports.types';
import {
  appendImportRows,
  confirmMovementImport,
  createMovementImport,
  getMovementImportBalances,
  getMovementImportReport,
  validateMovementImport,
} from './movementImports.api';

afterEach(() => vi.restoreAllMocks());

const answer = (data: unknown) => Promise.resolve({ data }) as never;

describe('movement imports API', () => {
  it('starts an import', async () => {
    const post = vi.spyOn(http, 'post').mockReturnValue(answer({ id: 1 }));
    await expect(
      createMovementImport({ sourceNamespace: 'siigo-main', fileName: 'kardex.xlsx' }),
    ).resolves.toEqual({ id: 1 });
    expect(post).toHaveBeenCalledWith('/movement-imports', {
      sourceNamespace: 'siigo-main',
      fileName: 'kardex.xlsx',
    });
  });

  it('sends a batch of rows', async () => {
    const post = vi.spyOn(http, 'post').mockReturnValue(answer({ received: 1 }));
    const rows = [{ rowNumber: 2, values: {} }] as ImportRow[];
    await appendImportRows(4, rows);
    expect(post).toHaveBeenCalledWith('/movement-imports/4/rows', { rows });
  });

  it('validates and confirms with a long timeout', async () => {
    const post = vi.spyOn(http, 'post').mockReturnValue(answer({}));
    await validateMovementImport(4);
    await confirmMovementImport(4, 2);
    expect(post).toHaveBeenNthCalledWith(1, '/movement-imports/4/validate', undefined, {
      timeout: 180_000,
    });
    expect(post).toHaveBeenNthCalledWith(
      2,
      '/movement-imports/4/confirm',
      { revision: 2 },
      {
        timeout: 180_000,
      },
    );
  });

  it('reads the issues and the balances with their filters', async () => {
    const get = vi.spyOn(http, 'get').mockReturnValue(answer({}));
    await getMovementImportReport(4, {
      page: 2,
      pageSize: 25,
      severity: 'ERROR',
      code: 'UNKNOWN_SKU',
    });
    await getMovementImportBalances(4, { page: 1, pageSize: 25 });
    expect(get).toHaveBeenNthCalledWith(1, '/movement-imports/4', {
      params: { page: 2, pageSize: 25, severity: 'ERROR', code: 'UNKNOWN_SKU' },
    });
    expect(get).toHaveBeenNthCalledWith(2, '/movement-imports/4/balances', {
      params: { page: 1, pageSize: 25 },
    });
  });
});
