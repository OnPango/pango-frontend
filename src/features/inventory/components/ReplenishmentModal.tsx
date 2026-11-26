import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasPermissionIn } from '@/core/auth/permissions';
import { DEFAULT_LEAD_TIME_DAYS } from '@/shared/lib/reorderPoint';
import { formatQuantity, type UnitRef } from '@/shared/lib/units';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Modal } from '@/shared/ui/components/Modal';
import { Spinner } from '@/shared/ui/components/Spinner';
import {
  useCurrentForecast,
  useReplenishment,
  useSetReplenishment,
} from '../api/inventory.queries';
import { inventoryErrorMessage } from '../content/inventory.errors';
import { ALERT_LABELS } from '../content/replenishment.labels';
import { resolveSystemValues } from '../content/replenishment.preview';
import type { Replenishment } from '../types/inventory.types';
import {
  replenishmentSchema,
  toLeadTimeDays,
  toNumber,
  type ReplenishmentFormValues,
} from '../types/replenishment.schema';
import { ReplenishmentComparison } from './ReplenishmentComparison';
import { ReplenishmentMethodSelector } from './ReplenishmentMethodSelector';

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
  const currentUser = useAuthStore((state) => state.user);
  const canReadForecast = hasPermissionIn(currentUser, 'forecast.read', target.warehouseId);

  const current = useReplenishment(target.productId, target.warehouseId);
  const forecast = useCurrentForecast(target.productId, target.warehouseId, canReadForecast);
  const save = useSetReplenishment(target.productId, target.warehouseId);

  const data = current.data;
  const quantity = (value: number) => formatQuantity(value, target.unit);

  const initialValues = useMemo<ReplenishmentFormValues | undefined>(
    () =>
      data
        ? {
            method: data.method,
            leadTimeDays: String(data.leadTimeDays),
            safetyStock: String(data.manualSafetyStock),
            reorderPoint: String(data.manualReorderPoint),
          }
        : undefined,
    [data],
  );

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ReplenishmentFormValues>({
    resolver: zodResolver(replenishmentSchema(data?.maxStock ?? null)),
    mode: 'onTouched',
    defaultValues: {
      method: 'manual',
      leadTimeDays: String(DEFAULT_LEAD_TIME_DAYS),
      safetyStock: '',
      reorderPoint: '',
    },
    values: initialValues,
    resetOptions: { keepDirtyValues: true },
  });

  const [selectedMethod, leadTimeText, manualSafetyStock, manualReorderPoint] = useWatch({
    control,
    name: ['method', 'leadTimeDays', 'safetyStock', 'reorderPoint'],
  });

  const parsedLeadTime = toLeadTimeDays(leadTimeText);
  const systemPreview = data
    ? resolveSystemValues({
        replenishment: data,
        forecast: forecast.data,
        forecastStatus: forecast.status,
        canReadForecast,
        leadTimeDays: parsedLeadTime,
      })
    : null;

  const copySystemToManual = (safetyStock: number, reorderPoint: number) => {
    setValue('safetyStock', String(safetyStock), { shouldDirty: true, shouldValidate: true });
    setValue('reorderPoint', String(reorderPoint), { shouldDirty: true, shouldValidate: true });
  };

  const submit = handleSubmit((values) => {
    if (!data) return;
    const days = toLeadTimeDays(values.leadTimeDays);
    if (days === null) return;
    save.mutate(
      {
        safetyStock: toNumber(values.safetyStock),
        reorderPoint: toNumber(values.reorderPoint),
        // Leaving them out would clear them: they keep what they had.
        minStock: data.minStock,
        maxStock: data.maxStock,
        method: values.method,
        leadTimeDays: days,
      },
      { onSuccess: (saved) => onSaved(target, saved) },
    );
  });

  return (
    <Modal
      size="lg"
      title="Reposición"
      description={`${target.productName} en ${target.warehouseName}`}
      onClose={onClose}
      dismissible={!save.isPending}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            isLoading={save.isPending}
            disabled={!data || !isDirty}
          >
            Guardar
          </Button>
        </>
      }
    >
      {!data || !systemPreview ? (
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
        <form id={FORM_ID} onSubmit={submit} noValidate className="space-y-6">
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

          <section aria-labelledby="replenishment-config" className="space-y-4">
            <h3 id="replenishment-config" className="text-sm font-bold text-fg">
              Configuración de reposición
            </h3>
            <ReplenishmentMethodSelector
              registerProps={register('method')}
              disabled={save.isPending}
            />
            <TextBox
              label="Tiempo de entrega"
              required
              inputMode="numeric"
              autoComplete="off"
              trailing={<span className="text-xs text-muted">días</span>}
              hint="Días desde el pedido hasta tenerlo disponible (1 a 365; por defecto 7). Escala los valores del sistema."
              error={errors.leadTimeDays?.message}
              containerClassName="sm:max-w-xs"
              {...register('leadTimeDays')}
            />
          </section>

          <section aria-labelledby="replenishment-compare" className="space-y-3">
            <h3 id="replenishment-compare" className="text-sm font-bold text-fg">
              Valores del sistema vs. manuales
            </h3>
            <ReplenishmentComparison
              unit={target.unit}
              selectedMethod={selectedMethod}
              savedMethod={data.method}
              preview={systemPreview}
              manualSafetyStock={manualSafetyStock}
              manualReorderPoint={manualReorderPoint}
              register={register}
              errors={errors}
              onCopyToManual={copySystemToManual}
            />
          </section>
        </form>
      )}
    </Modal>
  );
}

/**
 * US-016 / US-040: compare forecast-calculated and manual replenishment values side by side, pick
 * which source applies, and adjust the lead time in days.
 */
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
