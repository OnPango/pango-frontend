import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { MovementImportWizardState } from '../../hooks/useMovementImportWizard';
import { formatCount } from '../../lib/format';
import { TEMPLATE_FIELDS, toTemplateValue } from '../../lib/movementTemplate';
import { isEmptyRow } from '../../lib/spreadsheet';
import { StepFrame } from '../StepFrame';

export interface MovementMappingStepProps {
  wizard: MovementImportWizardState;
}

function SendingProgress({ wizard }: MovementMappingStepProps) {
  const progress = wizard.progress;
  if (!progress) return null;
  const validating = progress.phase === 'validating';
  const percent = progress.total === 0 ? 100 : Math.round((progress.sent / progress.total) * 100);
  return (
    <div aria-live="polite" className="space-y-2 rounded-2xl border border-line2 p-4">
      <div className="flex justify-between text-sm font-semibold text-fg">
        <span>
          {validating
            ? 'Revisando cada fila contra tus productos y bodegas…'
            : `Enviando filas: ${formatCount(progress.sent)} de ${formatCount(progress.total)}`}
        </span>
        {!validating && <span>{percent} %</span>}
      </div>
      <div
        role="progressbar"
        aria-label="Avance del envío"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={validating ? 100 : percent}
        className="h-2.5 overflow-hidden rounded-full bg-fg/10"
      >
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${validating ? 100 : percent}%` }}
        />
      </div>
    </div>
  );
}

/** Step 2: which column of the file carries each column of the template. Continuing validates. */
export function MovementMappingStep({ wizard }: MovementMappingStepProps) {
  const { mapping, sheet, headers, missing, noQuantity } = wizard;
  if (!mapping || !sheet) return null;

  const sample = sheet.rows.slice(1).find((row) => !isEmptyRow(row)) ?? [];
  const options = headers.map((header, index) => ({ value: String(index), label: header }));
  const blocked = missing.length > 0 || noQuantity || wizard.tooManyRows || wizard.rowCount === 0;

  return (
    <StepFrame
      title="2 · Une las columnas"
      onBack={() => wizard.goTo('file')}
      onNext={wizard.sendAndValidate}
      nextLabel="Revisar filas"
      nextDisabled={blocked}
      nextLoading={wizard.isSending}
      error={wizard.stepError}
    >
      <p className="text-sm text-muted">
        Tu archivo puede llamar distinto a cada dato. Aquí le dices a Pango cuál columna es cuál. Al
        continuar, Pango revisa cada fila; todavía no se guarda nada.
      </p>

      {missing.length > 0 || noQuantity ? (
        <Alert tone="warning" title="Faltan datos obligatorios por unir:">
          {[
            ...missing.map((field) => field.label.toLowerCase()),
            ...(noQuantity ? ['la cantidad que entra o la que sale'] : []),
          ].join(', ')}
          . Elige qué columna de tu archivo trae cada uno.
        </Alert>
      ) : wizard.tooManyRows ? (
        <Alert tone="danger">
          Tu archivo tiene {formatCount(wizard.rowCount)} filas y una carga admite hasta 200.000:
          divídelo en varios archivos.
        </Alert>
      ) : (
        <Alert tone="success">
          {wizard.isTemplate
            ? 'Como usaste la plantilla, Pango unió todas las columnas solo. Revisa y continúa.'
            : 'Todas las columnas obligatorias están unidas. Revisa y continúa.'}{' '}
          Se revisarán {formatCount(wizard.rowCount)} filas.
        </Alert>
      )}

      <div className="overflow-x-auto rounded-2xl border border-line2">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">Columnas de la plantilla y la columna de tu archivo</caption>
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
            {TEMPLATE_FIELDS.map((field) => {
              const index = mapping[field.column];
              const required =
                field.required ||
                (noQuantity && (field.column === 'quantity_in' || field.column === 'quantity_out'));
              const pending = required && index === null;
              const value = index === null ? null : toTemplateValue(field.column, sample[index]);
              return (
                <tr key={field.column} className="border-t border-line2 align-middle">
                  <th scope="row" className="px-4 py-3 font-semibold text-fg">
                    {field.label}
                    {field.hint && (
                      <span className="block text-xs font-normal text-muted">({field.hint})</span>
                    )}
                  </th>
                  <td className="px-4 py-3">
                    <Select
                      aria-label={`Columna para ${field.label}`}
                      value={index === null ? '' : String(index)}
                      onChange={(next) =>
                        wizard.setColumn(field.column, next === '' ? null : Number(next))
                      }
                      placeholder="Elige una columna…"
                      options={options}
                      clearable
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3 break-all text-muted">
                    {index === null ? `Ej.: ${field.example}` : (value ?? 'vacía')}
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

      <p className="text-sm text-muted">
        El tipo de movimiento puede venir como en la plantilla (SALE, PURCHASE_RECEIPT…) o en
        palabras como «venta», «compra», «consumo», «saldo inicial», «ajuste entrada» o «traslado
        salida».
      </p>

      <SendingProgress wizard={wizard} />
    </StepFrame>
  );
}
