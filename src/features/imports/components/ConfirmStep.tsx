import { Alert } from '@/shared/ui/components/Alert';
import { Checkbox } from '@/shared/ui/components/form/Checkbox';
import type { ImportKind, ImportPreview, Resolution } from '../types/imports.types';
import { formatCount } from '../lib/format';
import { StepFrame } from './StepFrame';

export interface ConfirmStepProps {
  kind: ImportKind;
  preview: ImportPreview;
  resolutions: Record<string, Resolution>;
  requireApproval: boolean;
  onRequireApproval: (value: boolean) => void;
  isStarting: boolean;
  error: string | null;
  /** Back to the "qué datos guardar" step to change a choice. */
  onChangeChoices: (() => void) | null;
  onBack: () => void;
  onConfirm: () => void;
}

/** Step 4: the summary of what is about to change, and the one button that makes it happen. */
export function ConfirmStep({
  kind,
  preview,
  resolutions,
  requireApproval,
  onRequireApproval,
  isStarting,
  error,
  onChangeChoices,
  onBack,
  onConfirm,
}: ConfirmStepProps) {
  const inventory = kind === 'inventory';
  const c = preview.creations;
  const editable = preview.conflicts.filter((item) => !item.locked);
  const fromFile = editable.filter((item) => resolutions[item.id] === 'FILE').length;
  const adjustments = preview.adjustments;

  return (
    <StepFrame
      title="4 · Confirma la carga"
      onBack={onBack}
      onNext={onConfirm}
      nextLabel="Confirmar carga"
      nextLoading={isStarting}
      error={error}
    >
      <ul className="space-y-3 text-fg">
        {inventory ? (
          <>
            <li>
              Se actualizarán las existencias de{' '}
              <strong>{formatCount(preview.products ?? 0)} productos</strong> en{' '}
              <strong>{preview.warehouses} bodegas</strong>.
            </li>
            {adjustments && (
              <li>
                Se crearán{' '}
                <strong>{formatCount(preview.stockChanges ?? 0)} ajustes de inventario</strong> (
                {adjustments.up} suben, {adjustments.down} bajan) con la fecha y hora de hoy.
              </li>
            )}
            {c && (
              <li>
                Se crearán <strong>{c.products} productos</strong>,{' '}
                <strong>{c.categories} categorías</strong>, <strong>{c.warehouses} bodega</strong> y{' '}
                <strong>{c.lots} lotes</strong> nuevos.
              </li>
            )}
            {editable.length > 0 && (
              <li className="flex flex-wrap items-center gap-x-2">
                <span>
                  De los registros con datos distintos:{' '}
                  <strong>{fromFile} toman lo del archivo</strong> y{' '}
                  <strong>{editable.length - fromFile} conservan lo de Pango</strong>.
                </span>
                {onChangeChoices && (
                  <button
                    type="button"
                    onClick={onChangeChoices}
                    className="text-sm font-semibold text-primary underline"
                  >
                    Cambiar
                  </button>
                )}
              </li>
            )}
          </>
        ) : (
          <>
            <li>
              Se cargarán <strong>{formatCount(preview.validRows)} movimientos</strong> de{' '}
              <strong>{preview.products} productos</strong>.
            </li>
            <li>
              Periodo: <strong>{preview.period}</strong>.
            </li>
          </>
        )}
        <li>
          Se dejarán fuera <strong>{formatCount(preview.errorRows)} filas</strong> con errores.
        </li>
      </ul>

      {inventory && adjustments && (
        <Checkbox
          checked={requireApproval}
          onChange={(event) => onRequireApproval(event.target.checked)}
          label="Pedir aprobación de los ajustes grandes (más de 10 % de diferencia) antes de aplicarlos."
          description={`Son ${adjustments.large} ajustes. Los demás se aplican de una vez.`}
        />
      )}

      <Alert tone="warning">
        {inventory
          ? 'Esto cambia tus existencias de hoy y no se puede deshacer. Revisa el resumen antes de confirmar.'
          : 'Esta carga se suma a tu historial y no cambia tus existencias de hoy. No se puede deshacer.'}
      </Alert>
    </StepFrame>
  );
}
