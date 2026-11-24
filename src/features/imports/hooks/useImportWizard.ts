import { useCallback, useMemo, useState } from 'react';
import { importsErrorMessage, isAcceptedFile } from '../content/imports.errors';
import { useAnalyzeFile, useConfirmImport, usePreviewImport } from '../api/imports.queries';
import type { ImportAnalysis, ImportKind, ImportPreview, Resolution } from '../types/imports.types';

export type WizardStep = 'file' | 'columns' | 'preview' | 'conflicts' | 'confirm' | 'result';

/** The state of one load, from picking the file to its result. */
export function useImportWizard(kind: ImportKind) {
  const [step, setStep] = useState<WizardStep>('file');
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});
  const [requireApproval, setRequireApproval] = useState(true);
  const [runId, setRunId] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const analyze = useAnalyzeFile();
  const previewMutation = usePreviewImport();
  const confirm = useConfirmImport();

  const chooseFile = useCallback(
    (file: File) => {
      setAnalysis(null);
      if (!isAcceptedFile(file.name)) {
        setFileError(`“${file.name}” no es un Excel ni un CSV. Elige un archivo .xlsx o .csv.`);
        return;
      }
      setFileError(null);
      analyze.mutate(
        { kind, file },
        {
          onSuccess: (result) => {
            setAnalysis(result);
            setSheet(result.file.sheets[0] ?? null);
            setMapping(Object.fromEntries(result.fields.map((f) => [f.key, f.column])));
          },
          onError: (error) =>
            setFileError(importsErrorMessage(error, 'No pudimos leer este archivo.')),
        },
      );
    },
    [analyze, kind],
  );

  const clearFile = useCallback(() => {
    setAnalysis(null);
    setFileError(null);
  }, []);

  const missing = useMemo(
    () => (analysis?.fields ?? []).filter((field) => field.required && !mapping[field.key]),
    [analysis, mapping],
  );

  const setColumn = useCallback(
    (key: string, column: string) => setMapping((prev) => ({ ...prev, [key]: column || null })),
    [],
  );

  const goToPreview = useCallback(() => {
    if (!analysis) return;
    setStepError(null);
    previewMutation.mutate(
      { uploadId: analysis.uploadId, mapping, filter: 'all' },
      {
        onSuccess: (result) => {
          setPreview(result);
          setStep('preview');
        },
        onError: (error) =>
          setStepError(importsErrorMessage(error, 'No pudimos revisar el archivo.')),
      },
    );
  }, [analysis, mapping, previewMutation]);

  const resolve = useCallback(
    (ids: string[], value: Resolution) =>
      setResolutions((prev) => ({ ...prev, ...Object.fromEntries(ids.map((id) => [id, value])) })),
    [],
  );

  const start = useCallback(() => {
    if (!analysis) return;
    setStepError(null);
    confirm.mutate(
      {
        uploadId: analysis.uploadId,
        input: { resolutions, requireApproval: kind === 'inventory' && requireApproval },
      },
      {
        onSuccess: (run) => {
          setRunId(run.id);
          setStep('result');
        },
        onError: (error) =>
          setStepError(importsErrorMessage(error, 'No pudimos iniciar la carga.')),
      },
    );
  }, [analysis, confirm, kind, requireApproval, resolutions]);

  return {
    step,
    setStep,
    analysis,
    fileError,
    isReading: analyze.isPending,
    sheet,
    setSheet,
    chooseFile,
    clearFile,
    mapping,
    missing,
    setColumn,
    preview,
    isPreviewing: previewMutation.isPending,
    goToPreview,
    resolutions,
    resolve,
    requireApproval,
    setRequireApproval,
    start,
    isStarting: confirm.isPending,
    runId,
    stepError,
  };
}

export type ImportWizard = ReturnType<typeof useImportWizard>;
