import { useId } from 'react';
import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { InventoryImportWizardState } from '../../hooks/useInventoryImportWizard';
import { formatCount } from '../../lib/format';
import {
  INVENTORY_FIELDS,
  toInventoryValue,
  type InventoryField,
} from '../../lib/inventoryTemplate';
import { isEmptyRow, type Cell } from '../../lib/spreadsheet';
import { StepFrame } from '../StepFrame';

export interface InventoryMappingStepProps {
  wizard: InventoryImportWizardState;
}

function SendingProgress({ wizard }: InventoryMappingStepProps) {
  const id = useId();
  const progress = wizard.progress;
  if (!progress) return null;
  const validating = progress.phase === 'validating';
  const label = validating
    ? 'Revisando cada fila contra tus productos, categorías y bodegas…'
    : `Enviando filas: ${formatCount(progress.sent)} de ${formatCount(progress.total)}`;
  return (
    <div className="space-y-2 rounded-2xl border border-line2 p-4">
      <p id={id} role="status" className="text-sm font-semibold text-fg">
        {label}
      </p>
      {/* Native <progress>: no value while validating, which has no progress to report. */}
      <progress
        aria-labelledby={id}
        max={progress.total || 1}
        value={validating ? undefined : progress.sent}
        className="h-2.5 w-full accent-primary"
      />
    </div>
  );
}

function FieldsTable({
  caption,
  fields,
  wizard,
  sample,
}: {
  caption: string;
  fields: InventoryField[];
  wizard: InventoryImportWizardState;
  sample: Cell[];
}) {
  const captionId = useId();
  const mapping = wizard.mapping!;
  const options = wizard.headers.map((header, index) => ({ value: String(index), label: header }));
  return (
    // A named region; its controls take the focus, so the keyboard scrolls it too.
    <div
      role="region"
      aria-labelledby={captionId}
      className="overflow-x-auto rounded-2xl border border-line2"
    >
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption id={captionId} className="sr-only">
          {caption}
        </caption>
        <thead className="bg-fg/5 text-xs text-muted uppercase">
          <tr>
            <th scope="col" className="px-4 py-2.5">
              Dato que necesita Pango
            </th>
            <th scope="col" className="px-4 py-2.5">
              Columna de tu archivo
            </th>
            <th scope="col" className="px-4 py-2.5">
              Primera fila
            </th>
            <th scope="col" className="px-4 py-2.5">
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => {
            const index = mapping[field.key];
            const pending = field.required && index === null;
            const value = index === null ? null : toInventoryValue(field.key, sample[index]);
            return (
              <tr key={field.key} className="border-t border-line2 align-middle">
                <th scope="row" className="px-4 py-3 font-semibold text-fg">
                  {field.label}
                </th>
                <td className="px-4 py-3">
                  <Select
                    aria-label={`Columna para ${field.label}`}
                    value={index === null ? '' : String(index)}
                    onChange={(next) =>
                      wizard.setColumn(field.key, next === '' ? null : Number(next))
                    }
                    placeholder="Elige una columna…"
                    options={options}
                    clearable
                    size="sm"
                  />
                </td>
                <td className="px-4 py-3 break-all text-muted">
                  {index === null ? '—' : (value ?? 'vacía')}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    tone={pending ? 'warning' : index !== null ? 'success' : 'neutral'}
                    size="sm"
                  >
                    {pending ? 'Falta unir' : index !== null ? 'Listo' : 'Opcional'}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Step 2: which column of the file feeds each field. Continuing sends the rows and validates. */
export function InventoryMappingStep({ wizard }: InventoryMappingStepProps) {
  const { mapping, sheet, missing } = wizard;
  if (!mapping || !sheet) return null;

  const sample = sheet.rows.slice(1).find((row) => !isEmptyRow(row)) ?? [];
  const required = INVENTORY_FIELDS.filter((f) => f.required);
  const optional = INVENTORY_FIELDS.filter((f) => !f.required);
  const optionalMapped = optional.filter((f) => mapping[f.key] !== null).length;
  const busy = wizard.isSending || wizard.isCancellingBlocking;
  const blocked = missing.length > 0 || wizard.tooManyRows || wizard.rowCount === 0 || busy;

  return (
    <StepFrame
      title="2 · Une las columnas"
      onBack={() => wizard.goTo('file')}
      onNext={wizard.sendAndValidate}
      nextLabel="Revisar filas"
      nextDisabled={blocked || wizard.blockingImportId !== null}
      nextLoading={wizard.isSending}
      error={wizard.stepError}
    >
      <p className="text-sm text-muted">
        Tu archivo puede llamar distinto a cada dato. Aquí le dices a Pango cuál columna es cuál. Al
        continuar, Pango revisa cada fila; todavía no se guarda nada.
      </p>

      {missing.length > 0 ? (
        <Alert tone="warning" title="Faltan datos obligatorios por unir:">
          {missing.map((field) => field.label.toLowerCase()).join(', ')}. Elige qué columna de tu
          archivo trae cada uno.
        </Alert>
      ) : wizard.tooManyRows ? (
        <Alert tone="danger">
          Tu archivo tiene {formatCount(wizard.rowCount)} filas y una carga admite hasta{' '}
          {formatCount(wizard.maxRows ?? 0)}: divídelo en varios archivos.
        </Alert>
      ) : (
        <Alert tone="success">
          {wizard.isTemplate
            ? 'Como usaste la plantilla, Pango unió todas las columnas solo. Revisa y continúa.'
            : 'Todas las columnas obligatorias están unidas. Revisa y continúa.'}{' '}
          Se revisarán {formatCount(wizard.rowCount)} filas.
        </Alert>
      )}

      {wizard.blockingImportId !== null && (
        <Alert tone="warning" title="Tienes otra carga de inventario abierta.">
          <p>
            La empezaste antes, quizá en otra pestaña o en otro equipo. Solo puede haber una abierta
            a la vez. Si la cancelas, nada de ella se guarda.
          </p>
          <Button
            size="sm"
            className="mt-3"
            onClick={wizard.cancelBlockingAndSend}
            isLoading={busy}
          >
            Cancelarla y revisar este archivo
          </Button>
        </Alert>
      )}

      <FieldsTable
        caption="Datos obligatorios y la columna de tu archivo que los trae"
        fields={required}
        wizard={wizard}
        sample={sample}
      />

      <details className="group space-y-3">
        <summary className="cursor-pointer text-sm font-semibold text-primary">
          Datos opcionales ({optionalMapped} de {optional.length} unidos)
        </summary>
        <div className="mt-3">
          <FieldsTable
            caption="Datos opcionales y la columna de tu archivo que los trae"
            fields={optional}
            wizard={wizard}
            sample={sample}
          />
        </div>
      </details>

      <SendingProgress wizard={wizard} />
    </StepFrame>
  );
}
