import { useState } from 'react';
import { FiDownload, FiFileText } from 'react-icons/fi';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { MovementImportWizardState } from '../../hooks/useMovementImportWizard';
import { formatCount } from '../../lib/format';
import { toSourceNamespace } from '../../lib/movementTemplate';
import { dataRowCount } from '../../lib/spreadsheet';
import { downloadTemplate } from '../../lib/template';
import { FileDropZone } from '../FileDropZone';
import { StepFrame } from '../StepFrame';

export interface MovementFileStepProps {
  wizard: MovementImportWizardState;
  onBack: () => void;
}

/** Step 1: choose the .xlsx or .csv and say which system it comes from. Nothing is sent yet. */
export function MovementFileStep({ wizard, onBack }: MovementFileStepProps) {
  const { spreadsheet, sheet, isReading, fileError } = wizard;
  const [namespaceTouched, setNamespaceTouched] = useState(false);

  const namespaceError =
    namespaceTouched && !wizard.namespaceValid
      ? 'Escribe un nombre corto: letras, números, punto, guion o guion bajo.'
      : undefined;

  return (
    <StepFrame
      title="1 · Elige tu archivo de movimientos"
      onBack={onBack}
      onNext={() => wizard.goTo('columns')}
      nextDisabled={!spreadsheet || !sheet || isReading || !wizard.namespaceValid}
    >
      {fileError && (
        <Alert tone="danger" title="No pudimos leer este archivo.">
          {fileError}
        </Alert>
      )}

      {spreadsheet && sheet ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line2 p-4">
            <FiFileText aria-hidden className="size-8 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-fg">{spreadsheet.fileName}</p>
              <p className="text-sm text-muted">
                {Math.max(1, Math.round(spreadsheet.sizeBytes / 1024))} KB ·{' '}
                {formatCount(dataRowCount(sheet))} filas · {wizard.headers.length} columnas
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={wizard.clearFile}>
              Cambiar archivo
            </Button>
          </div>
          {spreadsheet.sheets.length > 1 && (
            <Select
              label="Hoja a leer"
              value={sheet.name}
              onChange={wizard.chooseSheet}
              options={spreadsheet.sheets.map(({ name }) => ({ value: name, label: name }))}
              className="max-w-xs"
            />
          )}
          <Alert tone="success">
            {wizard.isTemplate
              ? `Es la plantilla de movimientos de Pango: encontramos sus ${wizard.headers.length} columnas.`
              : `Encontramos ${wizard.headers.length} columnas y ${formatCount(dataRowCount(sheet))} filas.`}{' '}
            Todavía no se envía nada: tu archivo se lee en este equipo. En el siguiente paso revisas
            cómo quedaron unidas las columnas.
          </Alert>
        </div>
      ) : (
        <FileDropZone
          isReading={isReading}
          onFile={(file) => void wizard.chooseFile(file)}
          hint="Excel (.xlsx) o CSV · hasta 200.000 filas"
        />
      )}

      <TextBox
        label="Sistema de origen"
        value={wizard.sourceNamespace}
        onChange={(event) => wizard.setSourceNamespace(event.target.value)}
        onBlur={() => {
          setNamespaceTouched(true);
          const suggested = toSourceNamespace(wizard.sourceNamespace);
          if (suggested && suggested !== wizard.sourceNamespace) {
            wizard.setSourceNamespace(suggested);
          }
        }}
        placeholder="siigo-principal"
        hint="El programa del que sale el archivo. Usa siempre el mismo nombre para ese programa: así Pango reconoce los movimientos que ya cargaste y no los repite."
        error={namespaceError}
        size="md"
        containerClassName="max-w-md"
      />

      <p className="text-sm text-muted">
        Una fila por línea de movimiento: número del movimiento, línea, fecha, bodega, SKU, tipo y
        cantidad. Pango une las columnas por su nombre y te pide confirmar cuál es cuál.{' '}
        <button
          type="button"
          onClick={() => downloadTemplate('movements')}
          className="inline-flex items-center gap-1 font-semibold text-primary underline"
        >
          <FiDownload aria-hidden />
          Descargar la plantilla
        </button>
      </p>
    </StepFrame>
  );
}
