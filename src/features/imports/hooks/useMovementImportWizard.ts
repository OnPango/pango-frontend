import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getApiErrorCode } from '@/core/api/errors';
import { confirmMovementImport, validateMovementImport } from '../api/movementImports.api';
import { movementImportErrorMessage } from '../content/movementImports.labels';
import {
  autoMap,
  buildRows,
  isTemplateFile,
  missingFields,
  quantityMissing,
  SOURCE_NAMESPACE_PATTERN,
  type ColumnMapping,
} from '../lib/movementTemplate';
import {
  headersOf,
  readSpreadsheet,
  SpreadsheetError,
  type SheetData,
  type Spreadsheet,
} from '../lib/spreadsheet';
import {
  TooManyRowsError,
  uploadMovementImport,
  type UploadProgress,
} from '../lib/uploadMovementImport';
import {
  IMPORT_LIMITS,
  type MovementImport,
  type MovementImportReport,
  type TemplateColumn,
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

/**
 * The state of one movement history import, from reading the file to the saved result:
 * 1. the browser reads the file (nothing is sent yet);
 * 2. the user joins its columns to the template; continuing sends the rows and validates them;
 * 3. the validation is reviewed (issues and balances);
 * 4. the reviewed `revision` is confirmed;
 * 5. the result: lines saved and lines another import had already saved.
 */
export function useMovementImportWizard() {
  const [step, setStep] = useState<MovementWizardStep>('file');
  const [spreadsheet, setSpreadsheet] = useState<Spreadsheet | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [sheetName, setSheetName] = useState<string | null>(null);
  const [sourceNamespace, setSourceNamespace] = useState(storedNamespace);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [upload, setUpload] = useState<{ key: string; importId: number } | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [report, setReport] = useState<MovementImportReport | null>(null);
  const [result, setResult] = useState<MovementImport | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  /** The last confirmation failed because the history changed since the review. */
  const [stale, setStale] = useState(false);

  const sheet: SheetData | null = useMemo(
    () => spreadsheet?.sheets.find((s) => s.name === sheetName) ?? null,
    [spreadsheet, sheetName],
  );
  const headers = useMemo(() => (sheet ? headersOf(sheet) : []), [sheet]);
  const rows = useMemo(() => (sheet && mapping ? buildRows(sheet, mapping) : []), [sheet, mapping]);

  const namespaceValid = SOURCE_NAMESPACE_PATTERN.test(sourceNamespace);
  const missing = useMemo(() => (mapping ? missingFields(mapping) : []), [mapping]);
  const noQuantity = mapping ? quantityMissing(mapping) : true;
  const tooManyRows = rows.length > IMPORT_LIMITS.maxRows;

  const selectSheet = useCallback((file: Spreadsheet, name: string) => {
    const next = file.sheets.find((s) => s.name === name);
    setSheetName(name);
    setMapping(next ? autoMap(headersOf(next)) : null);
  }, []);

  const chooseFile = useCallback(
    async (file: File) => {
      setFileError(null);
      setSpreadsheet(null);
      setIsReading(true);
      try {
        const read = await readSpreadsheet(file);
        setSpreadsheet(read);
        // The first sheet with data: workbooks often start with an instructions sheet.
        const first = read.sheets.find((s) => s.rows.length > 1) ?? read.sheets[0];
        selectSheet(read, first.name);
      } catch (error) {
        setFileError(
          error instanceof SpreadsheetError ? error.message : 'No pudimos leer este archivo.',
        );
      } finally {
        setIsReading(false);
      }
    },
    [selectSheet],
  );

  const clearFile = useCallback(() => {
    setSpreadsheet(null);
    setSheetName(null);
    setMapping(null);
    setFileError(null);
  }, []);

  const chooseSheet = useCallback(
    (name: string) => {
      if (spreadsheet) selectSheet(spreadsheet, name);
    },
    [spreadsheet, selectSheet],
  );

  const setColumn = useCallback((column: TemplateColumn, index: number | null) => {
    setMapping((prev) => (prev ? { ...prev, [column]: index } : prev));
  }, []);

  const uploadMutation = useMutation({ mutationFn: uploadMovementImport });
  const validateMutation = useMutation({ mutationFn: validateMovementImport });
  const confirmMutation = useMutation({
    mutationFn: ({ id, revision }: { id: number; revision: number }) =>
      confirmMovementImport(id, revision),
  });

  /** Step 2 → 3: sends the rows (to the same import when the file did not change) and validates. */
  const sendAndValidate = useCallback(() => {
    if (!spreadsheet || !sheetName || !namespaceValid || rows.length === 0) return;
    const namespace = sourceNamespace.trim();
    const key = uploadKey(spreadsheet, sheetName, namespace);
    const importId = upload?.key === key ? upload.importId : null;
    setStepError(null);
    setStale(false);
    rememberNamespace(namespace);
    uploadMutation.mutate(
      {
        importId,
        sourceNamespace: namespace,
        fileName: spreadsheet.fileName,
        rows,
        onProgress: setProgress,
      },
      {
        onSuccess: (validated) => {
          setUpload({ key, importId: validated.import.id });
          setReport(validated);
          setStep('preview');
        },
        onError: (error) => {
          // An import that can no longer take rows (confirmed, or gone): the next try starts a new one.
          const code = getApiErrorCode(error);
          if (code === 'IMPORT_CONFIRMED' || code === 'IMPORT_NOT_FOUND') setUpload(null);
          setStepError(
            error instanceof TooManyRowsError
              ? 'Una carga admite hasta 200.000 filas: divide el archivo.'
              : movementImportErrorMessage(error, 'No pudimos enviar las filas para revisarlas.'),
          );
        },
        onSettled: () => setProgress(null),
      },
    );
  }, [namespaceValid, rows, sheetName, sourceNamespace, spreadsheet, upload, uploadMutation]);

  /** After `IMPORT_STALE`: validates again and goes back to the review with the new revision. */
  const revalidate = useCallback(() => {
    if (!report) return;
    setStepError(null);
    validateMutation.mutate(report.import.id, {
      onSuccess: (validated) => {
        setStale(false);
        setReport(validated);
        setStep('preview');
      },
      onError: (error) =>
        setStepError(movementImportErrorMessage(error, 'No pudimos revisar el archivo de nuevo.')),
    });
  }, [report, validateMutation]);

  const confirm = useCallback(() => {
    if (!report) return;
    setStepError(null);
    confirmMutation.mutate(
      { id: report.import.id, revision: report.import.revision },
      {
        onSuccess: (saved) => {
          setResult(saved);
          setStep('result');
        },
        onError: (error) => {
          setStale(getApiErrorCode(error) === 'IMPORT_STALE');
          setStepError(movementImportErrorMessage(error, 'No pudimos guardar el historial.'));
        },
      },
    );
  }, [confirmMutation, report]);

  /** A new import from scratch, keeping only the source system. */
  const restart = useCallback(() => {
    clearFile();
    setUpload(null);
    setReport(null);
    setResult(null);
    setStepError(null);
    setStale(false);
    setStep('file');
  }, [clearFile]);

  const goTo = useCallback((next: MovementWizardStep) => {
    setStepError(null);
    setStep(next);
  }, []);

  return {
    step,
    goTo,
    spreadsheet,
    isReading,
    fileError,
    chooseFile,
    clearFile,
    sheet,
    chooseSheet,
    headers,
    isTemplate: isTemplateFile(headers),
    sourceNamespace,
    setSourceNamespace,
    namespaceValid,
    mapping,
    setColumn,
    missing,
    noQuantity,
    rowCount: rows.length,
    tooManyRows,
    sendAndValidate,
    isSending: uploadMutation.isPending,
    progress,
    report,
    revalidate,
    isRevalidating: validateMutation.isPending,
    confirm,
    isConfirming: confirmMutation.isPending,
    stale,
    result,
    restart,
    stepError,
  };
}

export type MovementImportWizardState = ReturnType<typeof useMovementImportWizard>;
