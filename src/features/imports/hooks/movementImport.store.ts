import { create } from 'zustand';
import { getApiErrorCode } from '@/core/api/errors';
import { confirmMovementImport, validateMovementImport } from '../api/movementImports.api';
import { movementImportErrorMessage } from '../content/movementImports.labels';
import {
  autoMap,
  buildRows,
  pickMovementSheet,
  SOURCE_NAMESPACE_PATTERN,
  type ColumnMapping,
} from '../lib/movementTemplate';
import { headersOf, readSpreadsheet, SpreadsheetError, type Spreadsheet } from '../lib/spreadsheet';
import {
  TooManyRowsError,
  uploadMovementImport,
  type UploadProgress,
} from '../lib/uploadMovementImport';
import type {
  MovementImport,
  MovementImportReport,
  TemplateColumn,
} from '../types/movementImports.types';

export type MovementWizardStep = 'file' | 'columns' | 'preview' | 'confirm' | 'result';

const NAMESPACE_KEY = 'pango_movement_import_source';

function storedNamespace(): string {
  try {
    return window.localStorage.getItem(NAMESPACE_KEY) ?? '';
  } catch {
    return '';
  }
}

function rememberNamespace(value: string): void {
  try {
    window.localStorage.setItem(NAMESPACE_KEY, value);
  } catch {
    // Private mode: the user types it again next time.
  }
}

/**
 * The import already started for this file, sheet and source. Its rows depend only on those
 * (empty rows are skipped whatever the mapping), so sending them again replaces each row: no
 * leftover rows from another file can stay behind.
 */
const uploadKey = (file: Spreadsheet, sheet: string, namespace: string) =>
  JSON.stringify([file.fileName, file.sizeBytes, sheet, namespace.toLowerCase()]);

interface MovementImportData {
  /** `<organization>:<user>` the import belongs to: another session starts from scratch. */
  owner: string | null;
  step: MovementWizardStep;
  spreadsheet: Spreadsheet | null;
  isReading: boolean;
  fileError: string | null;
  sheetName: string | null;
  sourceNamespace: string;
  mapping: ColumnMapping | null;
  upload: { key: string; importId: number } | null;
  isSending: boolean;
  progress: UploadProgress | null;
  report: MovementImportReport | null;
  isRevalidating: boolean;
  isConfirming: boolean;
  /** The last confirmation failed because the history changed since the review. */
  stale: boolean;
  result: MovementImport | null;
  stepError: string | null;
}

interface MovementImportActions {
  /** Starts over when the signed-in user or organization is not the one of the import. */
  claim: (owner: string) => void;
  goTo: (step: MovementWizardStep) => void;
  chooseFile: (file: File) => Promise<void>;
  clearFile: () => void;
  chooseSheet: (name: string) => void;
  setSourceNamespace: (value: string) => void;
  setColumn: (column: TemplateColumn, index: number | null) => void;
  sendAndValidate: () => Promise<void>;
  revalidate: () => Promise<void>;
  confirm: () => Promise<void>;
  /** A new import from scratch, keeping only the source system. */
  restart: () => void;
}

export type MovementImportState = MovementImportData & MovementImportActions;

const initial = (owner: string | null): MovementImportData => ({
  owner,
  step: 'file',
  spreadsheet: null,
  isReading: false,
  fileError: null,
  sheetName: null,
  sourceNamespace: storedNamespace(),
  mapping: null,
  upload: null,
  isSending: false,
  progress: null,
  report: null,
  isRevalidating: false,
  isConfirming: false,
  stale: false,
  result: null,
  stepError: null,
});

/**
 * Bumped whenever the import is discarded. Work still running for a discarded import (a file
 * being read, rows being sent or validated) finishes, but its result is dropped.
 */
let generation = 0;

/** The sheet's columns joined by name; `null` when the sheet is not in the file. */
function mappingFor(file: Spreadsheet, name: string): ColumnMapping | null {
  const sheet = file.sheets.find((s) => s.name === name);
  return sheet ? autoMap(headersOf(sheet)) : null;
}

/**
 * The movement history import in progress. It lives outside the screen, so leaving
 * Importar datos and coming back finds it where it was, and a batch still being sent or validated
 * lands its result here even if the screen is gone. It is kept in memory only: a reload starts
 * over (the file is never stored).
 *
 * 1. the browser reads the file (nothing is sent yet);
 * 2. the user joins its columns to the template; continuing sends the rows and validates them;
 * 3. the validation is reviewed (issues and balances);
 * 4. the reviewed `revision` is confirmed;
 * 5. the result: lines saved and lines another import had already saved.
 */
export const useMovementImportStore = create<MovementImportState>()((set, get) => {
  /** `set` for async work: does nothing once the import it belongs to was discarded. */
  const setter = () => {
    const mine = generation;
    return (partial: Partial<MovementImportData>) => {
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
        // Pango's workbook starts with its instructions: its data is in `Movimientos`.
        const first = pickMovementSheet(read.sheets) ?? read.sheets[0];
        update({ spreadsheet: read, sheetName: first.name, mapping: mappingFor(read, first.name) });
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
      if (file) set({ sheetName: name, mapping: mappingFor(file, name) });
    },

    setSourceNamespace: (value) => set({ sourceNamespace: value }),

    setColumn: (column, index) => {
      const mapping = get().mapping;
      if (mapping) set({ mapping: { ...mapping, [column]: index } });
    },

    sendAndValidate: async () => {
      const { spreadsheet, sheetName, mapping, sourceNamespace, upload, isSending } = get();
      const sheet = spreadsheet?.sheets.find((s) => s.name === sheetName);
      const namespace = sourceNamespace.trim();
      if (
        isSending ||
        !spreadsheet ||
        !sheet ||
        !mapping ||
        !SOURCE_NAMESPACE_PATTERN.test(namespace)
      ) {
        return;
      }
      const rows = buildRows(sheet, mapping);
      if (rows.length === 0) return;
      const key = uploadKey(spreadsheet, sheet.name, namespace);
      const update = setter();
      update({ isSending: true, stepError: null, stale: false });
      rememberNamespace(namespace);
      try {
        const validated = await uploadMovementImport({
          importId: upload?.key === key ? upload.importId : null,
          sourceNamespace: namespace,
          fileName: spreadsheet.fileName,
          rows,
          onProgress: (progress) => update({ progress }),
        });
        update({
          upload: { key, importId: validated.import.id },
          report: validated,
          step: 'preview',
        });
      } catch (error) {
        // An import that can no longer take rows (confirmed, or gone): the next try starts a new one.
        const code = getApiErrorCode(error);
        if (code === 'IMPORT_CONFIRMED' || code === 'IMPORT_NOT_FOUND') update({ upload: null });
        update({
          stepError:
            error instanceof TooManyRowsError
              ? 'Una carga admite hasta 200.000 filas: divide el archivo.'
              : movementImportErrorMessage(error, 'No pudimos enviar las filas para revisarlas.'),
        });
      } finally {
        update({ isSending: false, progress: null });
      }
    },

    revalidate: async () => {
      const { report, isRevalidating } = get();
      if (!report || isRevalidating) return;
      const update = setter();
      update({ isRevalidating: true, stepError: null });
      try {
        const validated = await validateMovementImport(report.import.id);
        update({ stale: false, report: validated, step: 'preview' });
      } catch (error) {
        update({
          stepError: movementImportErrorMessage(error, 'No pudimos revisar el archivo de nuevo.'),
        });
      } finally {
        update({ isRevalidating: false });
      }
    },

    confirm: async () => {
      const { report, isConfirming } = get();
      if (!report || isConfirming) return;
      const update = setter();
      update({ isConfirming: true, stepError: null });
      try {
        const saved = await confirmMovementImport(report.import.id, report.import.revision);
        update({ result: saved, step: 'result' });
      } catch (error) {
        update({
          stale: getApiErrorCode(error) === 'IMPORT_STALE',
          stepError: movementImportErrorMessage(error, 'No pudimos guardar el historial.'),
        });
      } finally {
        update({ isConfirming: false });
      }
    },

    restart: () => {
      generation++;
      set({ ...initial(get().owner), sourceNamespace: get().sourceNamespace });
    },
  };
});

/** An import was started and not finished: worth offering to continue it. */
export const hasImportInProgress = (state: MovementImportData) =>
  state.step !== 'result' && (state.spreadsheet !== null || state.report !== null);
