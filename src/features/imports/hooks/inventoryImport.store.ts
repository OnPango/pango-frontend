import { isAxiosError } from 'axios';
import { create } from 'zustand';
import { getApiErrorCode } from '@/core/api/errors';
import {
  cancelInventoryImport,
  confirmInventoryImport,
  getInventoryImport,
  getInventoryImportFields,
  validateInventoryImport,
} from '../api/inventoryImports.api';
import { inventoryImportErrorMessage } from '../content/inventoryImports.labels';
import {
  buildInventoryRows,
  readInventoryFile,
  toApiMapping,
  type InventoryColumnMapping,
} from '../lib/inventoryTemplate';
import { headersOf, readSpreadsheet, SpreadsheetError, type Spreadsheet } from '../lib/spreadsheet';
import {
  OversizedRowsError,
  TooManyRowsError,
  uploadInventoryImport,
  withRetry,
  type InventoryUploadProgress,
} from '../lib/uploadInventoryImport';
import type {
  InventoryFieldKey,
  InventoryImport,
  InventoryImportReport,
} from '../types/inventoryImports.types';
import { formatCount } from '../lib/format';

export type InventoryWizardStep = 'file' | 'columns' | 'preview' | 'confirm' | 'result';

/** The rows sent depend on the file, the sheet and the mapping: a change is a new import. */
const uploadKey = (file: Spreadsheet, sheet: string, mapping: InventoryColumnMapping) =>
  JSON.stringify([file.fileName, file.sizeBytes, sheet, mapping]);

interface InventoryImportData {
  /** `<organization>:<user>` the import belongs to: another session starts from scratch. */
  owner: string | null;
  step: InventoryWizardStep;
  spreadsheet: Spreadsheet | null;
  isReading: boolean;
  fileError: string | null;
  sheetName: string | null;
  mapping: InventoryColumnMapping | null;
  /** The import started for the current file and mapping, and the request id that created it. */
  upload: { key: string; clientRequestId: string; importId: number | null } | null;
  isSending: boolean;
  progress: InventoryUploadProgress | null;
  report: InventoryImportReport | null;
  isRevalidating: boolean;
  isConfirming: boolean;
  /** The last confirmation failed because something changed in Pango since the review. */
  stale: boolean;
  /** An import of this user, left open in another session, blocks a new one. */
  blockingImportId: number | null;
  isCancellingBlocking: boolean;
  result: InventoryImport | null;
  stepError: string | null;
}

interface InventoryImportActions {
  /** Starts over when the signed-in user or organization is not the one of the import. */
  claim: (owner: string) => void;
  goTo: (step: InventoryWizardStep) => void;
  chooseFile: (file: File) => Promise<void>;
  clearFile: () => void;
  chooseSheet: (name: string) => void;
  setColumn: (key: InventoryFieldKey, index: number | null) => void;
  sendAndValidate: () => Promise<void>;
  /** Cancels the user's own import left open elsewhere, then sends this file. */
  cancelBlockingAndSend: () => Promise<void>;
  revalidate: () => Promise<void>;
  confirm: () => Promise<void>;
  /** Ends this import (cancelling it in Pango if still open) and starts from scratch. */
  restart: () => void;
}

export type InventoryImportState = InventoryImportData & InventoryImportActions;

const initial = (owner: string | null): InventoryImportData => ({
  owner,
  step: 'file',
  spreadsheet: null,
  isReading: false,
  fileError: null,
  sheetName: null,
  mapping: null,
  upload: null,
  isSending: false,
  progress: null,
  report: null,
  isRevalidating: false,
  isConfirming: false,
  stale: false,
  blockingImportId: null,
  isCancellingBlocking: false,
  result: null,
  stepError: null,
});

/** Bumped whenever the import is discarded: results of work still running for it are dropped. */
let generation = 0;

/** Closes an import in Pango. It may already be closed or gone: that is fine. */
async function cancelQuietly(id: number): Promise<void> {
  try {
    await withRetry(() => cancelInventoryImport(id));
  } catch {
    // Closed already, or it expires by itself.
  }
}

function uploadErrorMessage(error: unknown): string {
  if (error instanceof TooManyRowsError) {
    return `Tu archivo tiene ${formatCount(error.rows)} filas y una carga admite hasta ${formatCount(error.max)}: divídelo en varios archivos.`;
  }
  if (error instanceof OversizedRowsError) {
    const shown = error.rowNumbers.slice(0, 5).map(formatCount).join(', ');
    const more = error.rowNumbers.length > 5 ? ` y ${error.rowNumbers.length - 5} más` : '';
    return `Algunas filas tienen textos demasiado largos (filas ${shown}${more}). Acórtalos y vuelve a subir el archivo.`;
  }
  return inventoryImportErrorMessage(error, 'No pudimos enviar las filas para revisarlas.');
}

/**
 * The inventory import in progress. It lives outside the screen, so leaving Importar datos and
 * coming back finds it where it was. Memory only: a reload starts over (the file is never stored),
 * and the open import in Pango expires by itself.
 *
 * 1. the browser reads the workbook (nothing is sent yet);
 * 2. the user checks how its columns were joined; continuing sends the rows and validates them;
 * 3. the preview: what would be created and the issues of each row;
 * 4. the reviewed `revision` is confirmed;
 * 5. the result: what was created and the stock recorded.
 */
export const useInventoryImportStore = create<InventoryImportState>()((set, get) => {
  /** `set` for async work: does nothing once the import it belongs to was discarded. */
  const setter = () => {
    const mine = generation;
    return (partial: Partial<InventoryImportData>) => {
      if (mine === generation) set(partial);
    };
  };

  return {
    ...initial(null),

    claim: (owner) => {
      if (get().owner !== owner) {
        generation++;
        set(initial(owner));
      }
    },

    goTo: (step) => set({ step, stepError: null }),

    chooseFile: async (file) => {
      const update = setter();
      update({
        fileError: null,
        spreadsheet: null,
        sheetName: null,
        mapping: null,
        isReading: true,
      });
      try {
        const read = await readSpreadsheet(file);
        const found = readInventoryFile(read.sheets);
        if (!found) throw new SpreadsheetError('El archivo no tiene filas para cargar.');
        update({ spreadsheet: read, sheetName: found.sheet.name, mapping: found.mapping });
      } catch (error) {
        update({
          fileError:
            error instanceof SpreadsheetError ? error.message : 'No pudimos leer este archivo.',
        });
      } finally {
        update({ isReading: false });
      }
    },

    clearFile: () => set({ spreadsheet: null, sheetName: null, mapping: null, fileError: null }),

    chooseSheet: (name) => {
      const file = get().spreadsheet;
      const sheet = file?.sheets.find((s) => s.name === name);
      if (sheet) set({ sheetName: name, mapping: readInventoryFile([sheet])?.mapping ?? null });
    },

    setColumn: (key, index) => {
      const mapping = get().mapping;
      if (mapping) set({ mapping: { ...mapping, [key]: index } });
    },

    sendAndValidate: async () => {
      const { spreadsheet, sheetName, mapping, upload, isSending } = get();
      const sheet = spreadsheet?.sheets.find((s) => s.name === sheetName);
      if (isSending || !spreadsheet || !sheet || !mapping) return;
      const rows = buildInventoryRows(sheet, mapping);
      if (rows.length === 0) return;

      const key = uploadKey(spreadsheet, sheet.name, mapping);
      const update = setter();
      update({ isSending: true, stepError: null, stale: false, blockingImportId: null });
      try {
        // Another file or mapping than the import already started: that one is discarded.
        let current = upload;
        if (current && current.key !== key) {
          if (current.importId !== null) await cancelQuietly(current.importId);
          current = null;
        }
        current ??= { key, clientRequestId: crypto.randomUUID(), importId: null };
        update({ upload: current });

        const { limits } = await withRetry(getInventoryImportFields);
        const started = current;
        const validated = await uploadInventoryImport({
          importId: started.importId,
          clientRequestId: started.clientRequestId,
          fileName: spreadsheet.fileName,
          sheetName: sheet.name,
          mapping: toApiMapping(mapping, headersOf(sheet)),
          rows,
          limits,
          onCreated: (importId) => update({ upload: { ...started, importId } }),
          onProgress: (progress) => update({ progress }),
        });
        update({ report: validated, step: 'preview' });
      } catch (error) {
        const code = getApiErrorCode(error);
        if (code === 'IMPORT_ACTIVE_EXISTS') {
          const importId = isAxiosError<{ importId?: number }>(error)
            ? error.response?.data?.importId
            : undefined;
          // Without `importId` the open import is someone else's: the message says so.
          if (importId !== undefined) {
            update({ blockingImportId: importId });
            return;
          }
        }
        // That import can no longer take these rows: the next try starts a new one.
        if (
          code === 'BATCH_CONFLICT' ||
          code === 'IDEMPOTENCY_CONFLICT' ||
          code === 'ROWS_EXCEED_TOTAL' ||
          code === 'IMPORT_CLOSED' ||
          code === 'IMPORT_NOT_FOUND'
        ) {
          update({ upload: null });
        }
        update({ stepError: uploadErrorMessage(error) });
      } finally {
        update({ isSending: false, progress: null });
      }
    },

    cancelBlockingAndSend: async () => {
      const { blockingImportId } = get();
      if (blockingImportId === null) return;
      const update = setter();
      update({ isCancellingBlocking: true, stepError: null });
      await cancelQuietly(blockingImportId);
      update({ isCancellingBlocking: false, blockingImportId: null });
      await get().sendAndValidate();
    },

    revalidate: async () => {
      const { report, isRevalidating } = get();
      if (!report || isRevalidating) return;
      const update = setter();
      update({ isRevalidating: true, stepError: null });
      try {
        const validated = await withRetry(() => validateInventoryImport(report.import.id));
        update({ stale: false, report: validated, step: 'preview' });
      } catch (error) {
        update({
          stepError: inventoryImportErrorMessage(error, 'No pudimos revisar el archivo de nuevo.'),
        });
      } finally {
        update({ isRevalidating: false });
      }
    },

    confirm: async () => {
      const { report, isConfirming } = get();
      if (!report || isConfirming) return;
      const { id, revision } = report.import;
      const update = setter();
      update({ isConfirming: true, stepError: null });
      try {
        const saved = await confirmInventoryImport(id, revision);
        update({ result: saved, step: 'result' });
      } catch (error) {
        // No answer (the wait ran out, or the connection dropped): it may have been saved anyway.
        if (isAxiosError(error) && !error.response) {
          try {
            const current = await withRetry(() => getInventoryImport(id));
            if (current.status === 'COMPLETED') {
              update({ result: current, step: 'result' });
              return;
            }
          } catch {
            // Unknown: the message below says to try again, which is safe.
          }
          update({
            stepError:
              'No supimos si se guardó: se cortó la conexión o tardó demasiado. Vuelve a confirmar; si ya se había guardado, no se repite.',
          });
          return;
        }
        update({
          stale: getApiErrorCode(error) === 'IMPORT_STALE',
          stepError: inventoryImportErrorMessage(error, 'No pudimos guardar el inventario.'),
        });
      } finally {
        update({ isConfirming: false });
      }
    },

    restart: () => {
      const { upload, result, owner } = get();
      generation++;
      // An organization has one open import at a time: leave none behind.
      if (upload?.importId != null && !result) void cancelQuietly(upload.importId);
      set(initial(owner));
    },
  };
});

/** An import was started and not finished: worth offering to continue it. */
export const hasInventoryImportInProgress = (state: InventoryImportData) =>
  state.step !== 'result' && (state.spreadsheet !== null || state.report !== null);
