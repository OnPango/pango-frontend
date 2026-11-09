import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { formatQuantity, unitLabel, type UnitRef } from '@/shared/lib/units';
import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Modal } from '@/shared/ui/components/Modal';
import { Spinner } from '@/shared/ui/components/Spinner';
import { useReplenishment, useSetReplenishment } from '../api/inventory.queries';
import { inventoryErrorMessage } from '../content/inventory.errors';
import { ALERT_LABELS, SOURCE_LABELS } from '../content/replenishment.labels';
import type { Replenishment } from '../types/inventory.types';
import {
  replenishmentSchema,
  toNumber,
  type ReplenishmentFormValues,
} from '../types/replenishment.schema';

export interface ReplenishmentTarget {
  productId: string;
  productName: string;
  unit: UnitRef;
  warehouseId: string;
  warehouseName: string;
}

interface ReplenishmentModalProps {
  /** Null: closed. */
  target: ReplenishmentTarget | null;
  onClose: () => void;
  onSaved: (target: ReplenishmentTarget, saved: Replenishment) => void;
}

const FORM_ID = 'replenishment-form';

function Figure({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className={`text-sm tabular-nums ${strong ? 'font-bold text-fg' : 'text-fg/90'}`}>
        {value}
      </dd>
    </div>
  );
}

function ReplenishmentContent({
  target,
  onClose,
  onSaved,
}: Omit<ReplenishmentModalProps, 'target'> & { target: ReplenishmentTarget }) {
  const current = useReplenishment(target.productId, target.warehouseId);
  const save = useSetReplenishment(target.productId, target.warehouseId);
  const data = current.data;
  const quantity = (value: number) => formatQuantity(value, target.unit);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ReplenishmentFormValues>({
    resolver: zodResolver(replenishmentSchema(data?.maxStock ?? null)),
    mode: 'onTouched',
    defaultValues: { safetyStock: '', reorderPoint: '' },
    // Filled once the current values arrive; "dirty" is measured against them.
    values: data
      ? { safetyStock: String(data.safetyStock), reorderPoint: String(data.reorderPoint) }
      : undefined,
  });

  const submit = handleSubmit((values) => {
    if (!data) return;
    save.mutate(
      {
        safetyStock: toNumber(values.safetyStock),
        reorderPoint: toNumber(values.reorderPoint),
        // Leaving them out would clear them: they keep what they had.
        minStock: data.minStock,
        maxStock: data.maxStock,
      },
      { onSuccess: (saved) => onSaved(target, saved) },
    );
  });

  const unit = unitLabel(target.unit).toLowerCase();

  return (
    <Modal
      title="Reposición"
      description={`${target.productName} en ${target.warehouseName}`}
      onClose={onClose}
      dismissible={!save.isPending}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            size="sm"
            isLoading={save.isPending}
            disabled={!data || !isDirty}
          >
            Guardar
          </Button>
        </>
      }
    >
      {!data ? (
        current.error ? (
          <Alert tone="danger">
            {inventoryErrorMessage(current.error, 'No se pudieron cargar los valores.')}
          </Alert>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted" role="status">
            <Spinner className="size-4" /> Cargando valores…
          </p>
        )
      ) : (
        <form id={FORM_ID} onSubmit={submit} noValidate className="space-y-5">
          {save.isError && (
            <Alert tone="danger">
              {inventoryErrorMessage(save.error, 'No se pudieron guardar los valores.')}
            </Alert>
          )}

          <section aria-labelledby="replenishment-stock" className="space-y-2">
            <h3 id="replenishment-stock" className="text-sm font-bold text-fg">
              Existencia en {target.warehouseName}
            </h3>
            <dl className="grid grid-cols-3 gap-3 rounded-xl bg-canvas p-3">
              <Figure label="Existencia" value={quantity(data.onHand)} />
              <Figure label="Reservado" value={quantity(data.reserved)} />
              <Figure label="Disponible" value={quantity(data.available)} strong />
            </dl>
            <p className="text-xs text-muted">
              La alerta compara el punto de reorden con lo disponible (existencia menos lo reservado
              por solicitudes en curso).
            </p>
            {data.openAlert && (
              <Alert tone="warning">
                Hay una alerta abierta: {ALERT_LABELS[data.openAlert.severity].toLowerCase()}.
              </Alert>
            )}
          </section>

          <section aria-labelledby="replenishment-values" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 id="replenishment-values" className="text-sm font-bold text-fg">
                Valores vigentes
              </h3>
              <Badge
                tone={data.source === 'calculated' ? 'primary' : 'neutral'}
                appearance="outline"
              >
                {SOURCE_LABELS[data.source].long}
              </Badge>
            </div>
            {data.source === 'calculated' && (
              <Alert tone="info">
                Estos valores los calculó el pronóstico. Si los cambias, quedan como manuales y
                reemplazan el cálculo.
              </Alert>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextBox
                label="Stock de seguridad"
                required
                inputMode="decimal"
                trailing={<span className="text-xs text-muted">{unit}</span>}
                hint="Colchón para cubrir la demanda mientras llega la reposición."
                error={errors.safetyStock?.message}
                {...register('safetyStock')}
              />
              <TextBox
                label="Punto de reorden"
                required
                inputMode="decimal"
                trailing={<span className="text-xs text-muted">{unit}</span>}
                hint="Cuando lo disponible llega a este valor se abre una alerta. 0 = sin alertas."
                error={errors.reorderPoint?.message}
                {...register('reorderPoint')}
              />
            </div>
          </section>
        </form>
      )}
    </Modal>
  );
}

/** US-016: safety stock and reorder point of a product in a warehouse, set by hand. */
export function ReplenishmentModal({ target, ...props }: ReplenishmentModalProps) {
  if (!target) return null;
  return (
    <ReplenishmentContent
      key={`${target.productId}-${target.warehouseId}`}
      target={target}
      {...props}
    />
  );
}
