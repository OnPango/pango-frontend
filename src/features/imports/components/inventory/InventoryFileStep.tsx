import { FiDownload, FiFileText } from 'react-icons/fi';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { InventoryImportWizardState } from '../../hooks/useInventoryImportWizard';
import { formatCount } from '../../lib/format';
import { downloadTemplate } from '../../lib/template';
import { FileDropZone } from '../FileDropZone';
import { StepFrame } from '../StepFrame';

export interface InventoryFileStepProps {
  wizard: InventoryImportWizardState;
  onBack: () => void;
}

/** Step 1: choose the workbook. It is read here; nothing is sent yet. */
export function InventoryFileStep({ wizard, onBack }: InventoryFileStepProps) {
  const { spreadsheet, sheet, isReading, fileError, rowCount, maxRows } = wizard;
  const limit = maxRows === null ? '' : ` · hasta ${formatCount(maxRows)} filas`;

  return (
    <StepFrame
      title="1 · Elige tu archivo de inventario"
      onBack={onBack}
      onNext={() => wizard.goTo('columns')}
      nextDisabled={!spreadsheet || !sheet || isReading}
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
                {Math.max(1, Math.round(spreadsheet.sizeBytes / 1024))} KB · hoja «{sheet.name}» ·{' '}
                {formatCount(rowCount)} filas · {wizard.headers.length} columnas
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
          <Alert tone={wizard.tooManyRows ? 'danger' : 'success'}>
            {wizard.tooManyRows
              ? `Tu archivo tiene ${formatCount(rowCount)} filas y una carga admite hasta ${formatCount(maxRows ?? 0)}: divídelo en varios archivos.`
              : wizard.isTemplate
                ? `Es la plantilla de inventario de Pango: encontramos sus ${wizard.headers.length} columnas y ${formatCount(rowCount)} filas.`
                : `Encontramos ${wizard.headers.length} columnas y ${formatCount(rowCount)} filas.`}{' '}
            Todavía no se envía nada: tu archivo se lee en este equipo.
          </Alert>
        </div>
      ) : (
        <FileDropZone
          isReading={isReading}
          onFile={(file) => void wizard.chooseFile(file)}
          hint={`Excel (.xlsx) o CSV${limit}`}
        />
      )}

      <p className="text-sm text-muted">
        Una fila por producto y bodega con lo que tienes hoy: código, nombre, categoría, unidad,
        bodega, seguimiento y saldo inicial. Si usas la plantilla, Pango reconoce todas las columnas
        solo.{' '}
        <button
          type="button"
          onClick={() => downloadTemplate('inventory')}
          className="inline-flex items-center gap-1 font-semibold text-primary underline"
        >
          <FiDownload aria-hidden />
          Descargar la plantilla
        </button>
      </p>
    </StepFrame>
  );
}
