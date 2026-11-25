import { describe, expect, it, vi } from 'vitest';
import { TEMPLATE_COLUMNS, type ImportRow } from '@/features/imports/types/movementImports.types';
import type * as Guard from '../guard';
import type { MockRequest } from '../server';
import { movementImportsRoutes } from './movement-imports.handlers';

vi.mock('../guard', async (importOriginal) => {
  const original = await importOriginal<typeof Guard>();
  return {
    ...original,
    authorize: () => ({ user: { id: 'user-1', organization_id: 'org-pango' } }),
  };
});

const call = (route: string, params: Record<string, string> = {}, body?: unknown) =>
  movementImportsRoutes[route]({
    method: route.split(' ')[0],
    path: '',
    params,
    query: {},
    headers: {},
    body,
  } satisfies MockRequest);

type Values = Partial<Record<(typeof TEMPLATE_COLUMNS)[number], string>>;
const row = (rowNumber: number, values: Values): ImportRow => ({
  rowNumber,
  values: {
    ...Object.fromEntries(TEMPLATE_COLUMNS.map((c) => [c, null])),
    ...values,
  } as ImportRow['values'],
});

// PRD-051 (no lots) and TDA-NORTE are seeds of the catalog and warehouse mocks.
const base = {
  line_number: '1',
  business_date: '2025-03-01',
  warehouse_code: 'TDA-NORTE',
  sku: 'PRD-051',
};

function start(namespace = 'siigo-main') {
  const created = call(
    'POST /movement-imports',
    {},
    { sourceNamespace: namespace, fileName: 'k.csv' },
  );
  return String((created.data as { id: number }).id);
}

describe('movement imports mock', () => {
  it('validates, reports the issues and saves only the valid rows', () => {
    const id = start('test-a');
    const rows = [
      row(2, {
        ...base,
        external_movement_id: 'OPEN-1',
        movement_type: 'OPENING_BALANCE',
        quantity_in: '10',
      }),
      row(3, { ...base, external_movement_id: 'SALE-1', movement_type: 'SALE', quantity_out: '4' }),
      row(4, {
        ...base,
        external_movement_id: 'SALE-2',
        movement_type: 'SALE',
        sku: 'NOPE',
        quantity_out: '1',
      }),
      row(5, { ...base, external_movement_id: 'SALE-3', movement_type: 'SALE', quantity_in: '1' }),
      row(6, { ...base, external_movement_id: 'SALE-1', movement_type: 'SALE', quantity_out: '4' }),
    ];
    expect(call('POST /movement-imports/:id/rows', { id }, { rows }).status).toBe(200);

    const validated = call('POST /movement-imports/:id/validate', { id });
    const report = validated.data as { import: Record<string, unknown> };
    expect(report.import).toMatchObject({
      status: 'VALIDATED',
      revision: 1,
      rowCount: 5,
      validRowCount: 2,
      invalidRowCount: 2,
      duplicateRowCount: 1,
      issueCounts: { UNKNOWN_SKU: 1, QUANTITY_SIDE: 1, DUPLICATE_ROW: 1 },
    });

    const balances = call('GET /movement-imports/:id/balances', { id }).data as {
      items: { closing: number | null; demand: number; rows: number }[];
    };
    expect(balances.items).toEqual([expect.objectContaining({ rows: 2, closing: 6, demand: 4 })]);

    expect(call('POST /movement-imports/:id/confirm', { id }, { revision: 0 }).status).toBe(409);
    const confirmed = call('POST /movement-imports/:id/confirm', { id }, { revision: 1 });
    const history = call('GET /historical-movements').data as {
      items: { movementType: string; quantityOut: number | null; source: { importId: number } }[];
    };
    const mine = history.items.filter((line) => line.source.importId === Number(id));
    expect(mine.map((line) => line.movementType)).toEqual(['SALE', 'OPENING_BALANCE']);
    expect(mine[0].quantityOut).toBe(4);
    expect(confirmed.data).toMatchObject({ status: 'CONFIRMED', savedCount: 2, skippedCount: 0 });
  });

  it('recognizes lines already imported under the same source', () => {
    const line = row(2, {
      ...base,
      external_movement_id: 'BUY-9',
      movement_type: 'PURCHASE_RECEIPT',
      quantity_in: '5',
      balance_after: '5',
    });
    const first = start('test-b');
    call('POST /movement-imports/:id/rows', { id: first }, { rows: [line] });
    call('POST /movement-imports/:id/validate', { id: first });
    call('POST /movement-imports/:id/confirm', { id: first }, { revision: 1 });

    const second = start('test-b');
    call('POST /movement-imports/:id/rows', { id: second }, { rows: [line] });
    const report = call('POST /movement-imports/:id/validate', { id: second }).data as {
      import: { validRowCount: number; duplicateRowCount: number; issueCounts: object };
    };
    expect(report.import.validRowCount).toBe(0);
    expect(report.import.issueCounts).toEqual({ ALREADY_IMPORTED: 1 });
    expect(
      call('POST /movement-imports/:id/confirm', { id: second }, { revision: 1 }).data,
    ).toMatchObject({
      code: 'IMPORT_NOTHING_VALID',
    });
  });

  it('refuses columns outside the template and validating without rows', () => {
    const id = start('test-c');
    const bad = { rows: [{ rowNumber: 2, values: { color: 'red' } }] };
    expect(call('POST /movement-imports/:id/rows', { id }, bad).data).toMatchObject({
      code: 'ROWS_INVALID',
    });
    expect(call('POST /movement-imports/:id/validate', { id }).data).toMatchObject({
      code: 'IMPORT_EMPTY',
    });
  });
});
