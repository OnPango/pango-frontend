import { beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmMovementImport } from '../api/movementImports.api';
import { uploadMovementImport } from '../lib/uploadMovementImport';
import type { MovementImportReport } from '../types/movementImports.types';
import { hasImportInProgress, useMovementImportStore } from './movementImport.store';

vi.mock('../api/movementImports.api', () => ({
  confirmMovementImport: vi.fn(),
  validateMovementImport: vi.fn(),
}));
vi.mock('../lib/uploadMovementImport', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  uploadMovementImport: vi.fn(),
}));

const csv =
  'external_movement_id,line_number,business_date,warehouse_code,sku,movement_type,quantity_out\nFV-1,1,2025-01-02,BOD,SKU-1,SALE,3\n';
const report = {
  import: { id: 9, revision: 1 },
  issues: { items: [], total: 0, page: 1, pageSize: 25 },
} as unknown as MovementImportReport;
const store = () => useMovementImportStore.getState();

beforeEach(() => {
  vi.mocked(uploadMovementImport).mockReset().mockResolvedValue(report);
  vi.mocked(confirmMovementImport).mockReset();
  useMovementImportStore.setState({ owner: null });
  store().claim('org-1:user-1');
});

async function readyToSend() {
  await store().chooseFile(new File([csv], 'kardex.csv'));
  store().setSourceNamespace('siigo-main');
  store().goTo('columns');
}

describe('movement import store', () => {
  it('keeps the import in progress without any screen mounted', async () => {
    await readyToSend();
    expect(store().mapping?.sku).toBe(4);
    expect(hasImportInProgress(store())).toBe(true);

    await store().sendAndValidate();
    expect(uploadMovementImport).toHaveBeenCalledWith(
      expect.objectContaining({
        importId: null,
        sourceNamespace: 'siigo-main',
        fileName: 'kardex.csv',
      }),
    );
    expect(store().step).toBe('preview');
    expect(store().report).toBe(report);
    expect(store().isSending).toBe(false);
  });

  it('sends the same file again to the same import', async () => {
    await readyToSend();
    await store().sendAndValidate();
    store().goTo('columns');
    await store().sendAndValidate();
    expect(vi.mocked(uploadMovementImport).mock.calls[1][0].importId).toBe(9);
  });

  it('marks a stale confirmation so the user validates again', async () => {
    await readyToSend();
    await store().sendAndValidate();
    vi.mocked(confirmMovementImport).mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { code: 'IMPORT_STALE' } },
    });
    await store().confirm();
    expect(store().stale).toBe(true);
    expect(store().stepError).toMatch(/Revísalo de nuevo/);
  });

  it('starts over on restart, keeping the source system', async () => {
    await readyToSend();
    store().restart();
    expect(store().spreadsheet).toBeNull();
    expect(store().step).toBe('file');
    expect(store().sourceNamespace).toBe('siigo-main');
    expect(hasImportInProgress(store())).toBe(false);
  });

  it('does not carry an import over to another session', async () => {
    await readyToSend();
    store().claim('org-1:user-1');
    expect(store().spreadsheet).not.toBeNull();
    store().claim('org-2:user-7');
    expect(store().spreadsheet).toBeNull();
    expect(store().owner).toBe('org-2:user-7');
  });

  it('drops the result of rows still being sent when the import is cancelled', async () => {
    await readyToSend();
    let finish: (value: MovementImportReport) => void = () => {};
    vi.mocked(uploadMovementImport).mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const sending = store().sendAndValidate();
    expect(store().isSending).toBe(true);
    store().restart();
    finish(report);
    await sending;
    expect(store().report).toBeNull();
    expect(store().step).toBe('file');
    expect(store().isSending).toBe(false);
  });
});
