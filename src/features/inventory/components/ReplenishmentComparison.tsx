import { useId } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { FiAlertTriangle, FiCopy } from 'react-icons/fi';
import { cn } from '@/shared/lib/cn';
import { formatQuantity, unitLabel, type UnitRef } from '@/shared/lib/units';
import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Spinner } from '@/shared/ui/components/Spinner';
import { CALCULATION_ISSUE_LABELS, formatCalculatedAt } from '../content/replenishment.labels';
import type { SystemPreviewState } from '../content/replenishment.preview';
import type { ReorderMethod } from '../types/inventory.types';
import { toNumber, type ReplenishmentFormValues } from '../types/replenishment.schema';

interface ReplenishmentComparisonProps {
  unit: UnitRef;
  selectedMethod: ReorderMethod;
  savedMethod: ReorderMethod;
  preview: SystemPreviewState;
  manualSafetyStock: string;
  manualReorderPoint: string;
  register: UseFormRegister<ReplenishmentFormValues>;
  errors: FieldErrors<ReplenishmentFormValues>;
  onCopyToManual: (safetyStock: number, reorderPoint: number) => void;
}

function SystemBadge({
  selectedMethod,
  savedMethod,
  preview,
}: {
  selectedMethod: ReorderMethod;
  savedMethod: ReorderMethod;
  preview: SystemPreviewState;
}) {
  if (selectedMethod === 'manual') {
    return (
      <Badge tone="neutral" appearance="outline" size="sm">
        {preview.kind === 'ready' ? 'Sugerido' : 'Sin cálculo'}
      </Badge>
    );
  }
  switch (preview.kind) {
    case 'ready':
      return (
        <Badge tone="primary" dot size="sm">
          {!preview.isPreview && savedMethod === 'forecast' ? 'En uso' : 'Se usará al guardar'}
        </Badge>
      );
    case 'unavailable':
      return (
        <Badge tone="warning" icon={FiAlertTriangle} size="sm">
          Sin cálculo
        </Badge>
      );
    case 'loading':
      return (
        <Badge tone="neutral" appearance="outline" size="sm">
          Calculando
        </Badge>
      );
    case 'invalid_lead_time':
      return (
        <Badge tone="warning" appearance="outline" size="sm">
          Revisar días
        </Badge>
      );
    case 'unreadable':
      return (
        <Badge tone="primary" appearance="outline" dot size="sm">
          Se calculará al guardar
        </Badge>
      );
  }
}

function ManualBadge({
  selectedMethod,
  savedMethod,
  preview,
}: {
  selectedMethod: ReorderMethod;
  savedMethod: ReorderMethod;
  preview: SystemPreviewState;
}) {
  if (selectedMethod === 'manual') {
    return (
      <Badge tone="primary" dot size="sm">
        {savedMethod === 'manual' ? 'En uso' : 'Se usará al guardar'}
      </Badge>
    );
  }
  if (preview.kind === 'unavailable') {
    return (
      <Badge tone="warning" dot size="sm">
        Respaldo activo
      </Badge>
    );
  }
  return (
    <Badge tone="neutral" appearance="outline" size="sm">
      Respaldo
    </Badge>
  );
}

/**
 * Side-by-side comparison between system-calculated thresholds (from demand forecast + lead time)
 * and user-editable manual thresholds. Fixed border widths avoid layout shift when toggling method.
 */
export function ReplenishmentComparison({
  unit,
  selectedMethod,
  savedMethod,
  preview,
  manualSafetyStock,
  manualReorderPoint,
  register,
  errors,
  onCopyToManual,
}: ReplenishmentComparisonProps) {
  const systemHeadingId = useId();
  const manualHeadingId = useId();
  const shortUnit = unitLabel(unit).toLowerCase();
  const matchesManual =
    preview.kind === 'ready' &&
    toNumber(manualSafetyStock) === preview.safetyStock &&
    toNumber(manualReorderPoint) === preview.reorderPoint;

  const systemCardStyle =
    selectedMethod === 'forecast'
      ? preview.kind === 'unavailable'
        ? 'border-warning/50 bg-warning/5'
        : 'border-primary bg-primary/5'
      : 'border-line2 bg-canvas/60';

  const manualCardStyle =
    selectedMethod === 'manual' ? 'border-primary bg-surface' : 'border-line2 bg-surface';

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <article
        aria-labelledby={systemHeadingId}
        className={cn(
          'flex flex-col justify-between gap-4 rounded-2xl border-2 p-4 transition-colors',
          systemCardStyle,
        )}
      >
        <div className="space-y-3">
          <header className="flex flex-wrap items-center justify-between gap-2">
            <h4 id={systemHeadingId} className="text-sm font-bold text-fg">
              Sistema (pronóstico)
            </h4>
            <SystemBadge
              selectedMethod={selectedMethod}
              savedMethod={savedMethod}
              preview={preview}
            />
          </header>

          {preview.kind === 'loading' && (
            <p className="flex items-center gap-2 text-sm text-muted" role="status">
              <Spinner className="size-4" /> Calculando valores del pronóstico…
            </p>
          )}

          {preview.kind === 'invalid_lead_time' && (
            <p className="text-xs leading-relaxed text-muted">
              Escribe un tiempo de entrega válido (1 a 365 días) para ver los valores calculados por
              el sistema.
            </p>
          )}

          {preview.kind === 'unreadable' && (
            <p className="text-xs leading-relaxed text-muted">
              No tienes permiso para ver los pronósticos de este almacén. Al guardar con «Sistema»,
              el servidor calculará los valores vigentes (o usará los manuales si aún no hay
              pronóstico).
            </p>
          )}

          {preview.kind === 'unavailable' && (
            <Alert tone="warning" title={CALCULATION_ISSUE_LABELS[preview.issue].title}>
              {CALCULATION_ISSUE_LABELS[preview.issue].detail}
            </Alert>
          )}

          {preview.kind === 'ready' && (
            <>
              <dl className="grid grid-cols-2 gap-3 rounded-xl border border-line2/70 bg-surface p-3">
                <div className="min-w-0">
                  <dt className="text-xs font-semibold text-muted">Stock de seguridad</dt>
                  <dd className="mt-0.5 text-base font-bold text-fg tabular-nums">
                    {formatQuantity(preview.safetyStock, unit)}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs font-semibold text-muted">Punto de reorden</dt>
                  <dd className="mt-0.5 text-base font-bold text-fg tabular-nums">
                    {formatQuantity(preview.reorderPoint, unit)}
                  </dd>
                </div>
              </dl>

              <p className="text-xs leading-relaxed text-muted">
                {!preview.isPreview && preview.calculatedAt
                  ? `Calculado el ${formatCalculatedAt(preview.calculatedAt)}`
                  : `Vista previa para ${preview.leadTimeDays} ${preview.leadTimeDays === 1 ? 'día' : 'días'} de entrega`}
                {preview.horizonWeeks ? ` (horizonte de ${preview.horizonWeeks} sem.).` : '.'}
              </p>

              {selectedMethod === 'forecast' && (
                <p className="text-xs leading-relaxed text-fg/80">
                  Cada nueva predicción recalcula y sobrescribe estos valores automáticamente.
                </p>
              )}
            </>
          )}
        </div>

        {preview.kind === 'ready' && !matchesManual && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onCopyToManual(preview.safetyStock, preview.reorderPoint)}
            className="gap-1.5 self-start"
          >
            <FiCopy aria-hidden className="size-3.5" />
            Copiar a manuales
          </Button>
        )}
      </article>

      <article
        aria-labelledby={manualHeadingId}
        className={cn(
          'flex flex-col gap-3 rounded-2xl border-2 p-4 transition-colors',
          manualCardStyle,
        )}
      >
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h4 id={manualHeadingId} className="text-sm font-bold text-fg">
            Manual
          </h4>
          <ManualBadge
            selectedMethod={selectedMethod}
            savedMethod={savedMethod}
            preview={preview}
          />
        </header>

        {selectedMethod === 'forecast' && (
          <p className="text-xs leading-relaxed text-muted">
            Se conservan y se usan como respaldo si alguna vez no hay pronóstico vigente.
          </p>
        )}

        <div className="space-y-3">
          <TextBox
            label="Stock de seguridad"
            required
            inputMode="decimal"
            trailing={<span className="text-xs text-muted">{shortUnit}</span>}
            hint="Colchón para cubrir la demanda mientras llega la reposición."
            error={errors.safetyStock?.message}
            {...register('safetyStock')}
          />
          <TextBox
            label="Punto de reorden"
            required
            inputMode="decimal"
            trailing={<span className="text-xs text-muted">{shortUnit}</span>}
            hint="Cuando lo disponible llega a este valor se abre una alerta. 0 = sin alertas."
            error={errors.reorderPoint?.message}
            {...register('reorderPoint')}
          />
        </div>
      </article>
    </div>
  );
}

