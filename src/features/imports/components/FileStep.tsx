import { useRef, useState, type DragEvent } from 'react';
import { FiFileText, FiUploadCloud } from 'react-icons/fi';
import { cn } from '@/shared/lib/cn';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Spinner } from '@/shared/ui/components/Spinner';
import { Select } from '@/shared/ui/components/form/select/Select';
import { KIND_COPY } from '../content/imports.labels';
import type { ImportAnalysis, ImportKind } from '../types/imports.types';
import { formatCount } from '../lib/format';
import { StepFrame } from './StepFrame';

export interface FileStepProps {
  kind: ImportKind;
  analysis: ImportAnalysis | null;
  isReading: boolean;
  error: string | null;
  sheet: string | null;
  onSheet: (sheet: string) => void;
  onFile: (file: File) => void;
  onClear: () => void;
  onBack: () => void;
  onNext: () => void;
}

const OTHER_REASONS = [
  'Pasa de 500.000 filas: divídelo en dos archivos.',
  'Está vacío o no tiene encabezados en la primera fila.',
  'Tiene contraseña: quítasela antes de subirlo.',
];

/** Step 1: choose the .xlsx or .csv. Nothing is loaded yet. */
export function FileStep({
  kind,
  analysis,
  isReading,
  error,
  sheet,
  onSheet,
  onFile,
  onClear,
  onBack,
  onNext,
}: FileStepProps) {
  const copy = KIND_COPY[kind];
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <StepFrame
      title={`1 · ${copy.fileTitle}`}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!analysis || isReading}
    >
      <input
        ref={input}
        type="file"
        accept=".xlsx,.csv"
        className="sr-only"
        aria-label="Archivo de Excel o CSV"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = '';
        }}
      />

      {error && (
        <Alert tone="danger" title="No pudimos leer este archivo.">
          {error}
        </Alert>
      )}

      {analysis ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line2 p-4">
            <FiFileText aria-hidden className="size-8 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-fg">{analysis.file.name}</p>
              <p className="text-sm text-muted">
                {analysis.file.sizeKb} KB · {formatCount(analysis.file.rows)} filas ·{' '}
                {analysis.file.columns} columnas
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onClear}>
              Cambiar archivo
            </Button>
          </div>
          {analysis.file.sheets.length > 1 && sheet && (
            <Select
              label="Hoja a leer"
              value={sheet}
              onChange={onSheet}
              options={analysis.file.sheets.map((name) => ({ value: name, label: name }))}
              className="max-w-xs"
            />
          )}
          <Alert tone="success">
            {analysis.file.isTemplate
              ? `Es la ${copy.template}: encontramos sus ${analysis.file.columns} columnas y ${formatCount(analysis.file.rows)} filas.`
              : `Encontramos ${analysis.file.columns} columnas y ${formatCount(analysis.file.rows)} filas.`}{' '}
            Todavía no se carga nada. En el siguiente paso revisas cómo quedaron unidas las
            columnas.
          </Alert>
        </div>
      ) : (
        <>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              'flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition',
              dragging ? 'border-primary bg-primary/5' : 'border-line2',
            )}
          >
            {isReading ? (
              <Spinner className="size-8 text-primary" />
            ) : (
              <FiUploadCloud aria-hidden className="size-9 text-muted" />
            )}
            <p className="font-semibold text-fg">
              {isReading ? 'Leyendo tu archivo…' : 'Arrastra tu archivo aquí'}
            </p>
            <p className="text-sm text-muted">Excel (.xlsx) o CSV · hasta 500.000 filas</p>
            <Button variant="outline" onClick={() => input.current?.click()} disabled={isReading}>
              Seleccionar archivo
            </Button>
          </div>
          {error ? (
            <div>
              <p className="text-sm font-semibold text-fg">
                Otros motivos por los que un archivo no se puede leer
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                {OTHER_REASONS.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted">
              {kind === 'inventory'
                ? `Usa la ${copy.template}: una fila por producto, bodega, ubicación y lote, con lo que tienes hoy. No cambies los encabezados; así Pango une las columnas solo.`
                : `Pango lee las columnas y te pide confirmar cuál es cuál. Aún no se carga nada. ¿No sabes cómo armarlo? Descarga la ${copy.template}.`}
            </p>
          )}
        </>
      )}
    </StepFrame>
  );
}
