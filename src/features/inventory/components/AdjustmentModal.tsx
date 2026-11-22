import { useEffect, useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { formatQuantity, unitLabel } from '@/shared/lib/units';
import { movementTypeDescription, movementTypeLabel } from '@/shared/lib/movementTypes';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { FormSelect } from '@/shared/ui/components/form/FormSelect';
import { TextArea } from '@/shared/ui/components/form/TextArea';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Modal } from '@/shared/ui/components/Modal';
import { useMovementTypes, useStockWarehouses } from '../api/inventory.queries';
import { adjustedText } from '../content/movement.labels';
import { useAdjustmentForm } from '../hooks/useAdjustmentForm';
import { NEW_LOT } from '../types/adjustment.schema';
import type { RegisteredMovement, StockProduct } from '../types/inventory.types';

/** The product and warehouse being looked at, chosen beforehand. */
export interface AdjustmentTarget {
  productId: string | null;
  warehouseId: string | null;
}

interface AdjustmentModalProps {
  /** Null: closed. */
  target: AdjustmentTarget | null;
  products: StockProduct[];
  onClose: () => void;
  onSaved: (movement: RegisteredMovement) => void;
}

const FORM_ID = 'adjustment-form';

const formatDay = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(`${iso}T12:00:00`));

function AdjustmentForm({
  target,
  products,
  onClose,
  onSaved,
}: Omit<AdjustmentModalProps, 'target'> & { target: AdjustmentTarget }) {
  const {
    form,
    submit,
    product,
    lots,
    lotsLoading,
    stockError,
    lotCode,
    recorded,
    difference,
    shortfall,
    refreshing,
    isSubmitting,
    serverError,
  } = useAdjustmentForm({
    products,
    initialProductId: target.productId,
    initialWarehouseId: target.warehouseId,
    onSaved,
  });
  const {
    register,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = form;

  const [warehouseId, productId, lot] = useWatch({
    control,
    name: ['warehouseId', 'productId', 'lot'],
  });
  const warehouses = useStockWarehouses();
  const types = useMovementTypes(warehouseId || null);

  // Only the adjustment types the user's roles allow in the chosen warehouse.
  const adjustmentTypes = useMemo(
    () => (types.data ?? []).filter((type) => type.nature === 'adjustment'),
    [types.data],
  );

  // A type that is not offered in the new warehouse is cleared; a single one is chosen for you.
  useEffect(() => {
    if (!types.data) return;
    const current = getValues('movementTypeId');
    if (adjustmentTypes.length === 1 && current !== adjustmentTypes[0].id) {
      setValue('movementTypeId', adjustmentTypes[0].id, { shouldValidate: true });
    } else if (current && !adjustmentTypes.some((type) => type.id === current)) {
      setValue('movementTypeId', '');
    }
  }, [types.data, adjustmentTypes, getValues, setValue]);

  // A lot that has no stock in the new warehouse (or product) cannot stay chosen.
  useEffect(() => {
    const current = getValues('lot');
    if (current && current !== NEW_LOT && !lots.some((candidate) => candidate.code === current)) {
      setValue('lot', '');
    }
  }, [lots, getValues, setValue]);

  const warehouseOptions = (warehouses.data ?? []).map((warehouse) => ({
    value: warehouse.id,
    label: warehouse.name,
    description: warehouse.code,
  }));
  const productOptions = products.map((candidate) => ({
    // The search box filters by label: code and name both match.
    value: candidate.id,
    label: `${candidate.name} · ${candidate.sku}`,
    description: unitLabel(candidate.unit),
  }));

  const warehouseName = warehouses.data?.find((warehouse) => warehouse.id === warehouseId)?.name;
  const noTypes = Boolean(warehouseId) && types.isSuccess && adjustmentTypes.length === 0;
  const amount = (value: number) => (product ? formatQuantity(value, product.unit) : String(value));
  const where = lotCode ? `en el lote ${lotCode}` : `en ${warehouseName ?? 'este almacén'}`;

  return (
    <Modal
      title="Registrar ajuste"
      description="Corrige la existencia con lo que contaste. Pango registra la diferencia como un movimiento."
      onClose={onClose}
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            isLoading={isSubmitting}
            disabled={noTypes}
          >
            Registrar ajuste
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} noValidate className="space-y-5">
        {serverError && <Alert tone="danger">{serverError}</Alert>}

        <div
          className={`grid grid-cols-1 gap-4 ${adjustmentTypes.length > 1 ? 'sm:grid-cols-2' : ''}`}
        >
          <FormSelect
            control={control}
            name="warehouseId"
            label="Almacén"
            required
            placeholder={
              warehouses.isLoading
                ? 'Cargando almacenes…'
                : warehouseOptions.length > 0
                  ? 'Elige el almacén'
                  : 'No hay almacenes abiertos'
            }
            options={warehouseOptions}
            searchable
            searchPlaceholder="Buscar almacén…"
            emptyMessage="Ningún almacén coincide"
          />
          {/* Organizations start with one adjustment type: it is chosen for you, no need to ask. */}
          {adjustmentTypes.length > 1 && (
            <FormSelect
              control={control}
              name="movementTypeId"
              label="Tipo de ajuste"
              required
              options={adjustmentTypes.map((type) => ({
                value: type.id,
                label: movementTypeLabel(type),
                description: movementTypeDescription(type),
              }))}
              placeholder="Elige el tipo"
            />
          )}
        </div>
        {noTypes && (
          <Alert tone="warning">
            Tus roles en {warehouseName ?? 'este almacén'} no permiten registrar ajustes.
          </Alert>
        )}

        <FormSelect
          control={control}
          name="productId"
          label="Producto"
          required
          placeholder="Busca por código o nombre"
          options={productOptions}
          searchable
          searchPlaceholder="Código o nombre…"
          emptyMessage="Ningún producto coincide"
        />

        {stockError && <Alert tone="danger">{stockError}</Alert>}

        {product?.tracksLots && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormSelect
              control={control}
              name="lot"
              label="Lote"
              required
              disabled={!warehouseId || lotsLoading}
              placeholder={
                !warehouseId
                  ? 'Primero elige el almacén'
                  : lotsLoading
                    ? 'Cargando lotes…'
                    : 'Elige el lote que contaste'
              }
              options={[
                ...lots.map((candidate) => ({
                  value: candidate.code,
                  label: candidate.code,
                  description: [
                    formatQuantity(candidate.onHand, product.unit),
                    candidate.expiryDate ? `vence el ${formatDay(candidate.expiryDate)}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · '),
                })),
                {
                  value: NEW_LOT,
                  label: 'Otro lote',
                  description: 'Uno sin existencia aquí que encontraste al contar',
                },
              ]}
              searchable
              searchPlaceholder="Buscar lote…"
              emptyMessage="Ningún lote coincide"
            />
            {lot === NEW_LOT && (
              <TextBox
                label="Código del lote"
                required
                maxLength={40}
                placeholder="Ej. L-2026-11"
                hint="Si el lote no existe todavía, se crea."
                error={errors.newLot?.message}
                {...register('newLot')}
              />
            )}
          </div>
        )}

        {/* What Pango has beside what was counted: the comparison the user is making. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-fg">En Pango</p>
            <p className="flex min-h-11 items-center rounded-xl bg-fg/5 px-3.5 text-sm font-semibold text-fg tabular-nums">
              {recorded !== null ? (
                amount(recorded)
              ) : refreshing ? (
                <span className="font-normal text-muted">Consultando…</span>
              ) : (
                '—'
              )}
            </p>
            <p className="mt-1.5 text-xs text-muted">
              {recorded !== null
                ? `Registrado ${where}.`
                : refreshing
                  ? 'Leyendo la existencia actual.'
                  : product?.tracksLots && warehouseId && productId
                    ? 'Elige el lote que contaste.'
                    : 'Elige el almacén y el producto.'}
            </p>
          </div>
          <TextBox
            label="Cantidad contada"
            required
            inputMode="decimal"
            placeholder="0"
            trailing={
              product ? (
                <span className="text-xs text-muted">{unitLabel(product.unit).toLowerCase()}</span>
              ) : undefined
            }
            hint="Lo que encontraste; puede ser cero."
            error={errors.counted?.message}
            {...register('counted')}
          />
        </div>

        <div aria-live="polite" className="space-y-3 empty:hidden">
          {difference !== null && recorded !== null && (
            <p className="rounded-xl border border-line2 px-4 py-3 text-sm text-fg">
              {difference === 0 ? (
                'Coincide con lo registrado: no hay nada que ajustar.'
              ) : (
                <>
                  <strong className={difference > 0 ? 'text-success' : 'text-danger'}>
                    {adjustedText(
                      difference < 0,
                      Math.abs(difference),
                      amount(Math.abs(difference)),
                    )}
                  </strong>
                  : la existencia {where} pasa de {amount(recorded)} a{' '}
                  {amount(recorded + difference)}.
                </>
              )}
            </p>
          )}
          {shortfall && (
            <Alert tone="warning">
              Las solicitudes en atención tienen {amount(shortfall.reserved)} en reserva y en{' '}
              {warehouseName ?? 'el almacén'} quedarían {amount(Math.max(0, shortfall.left))}:
              alguna no se podrá completar hasta que entre más.
            </Alert>
          )}
        </div>

        <TextArea
          label="Motivo"
          required
          rows={3}
          maxLength={2000}
          placeholder="Ej. Conteo de fin de mes: 5 cajas dañadas por humedad."
          hint="Queda en el historial con el movimiento."
          error={errors.notes?.message}
          {...register('notes')}
        />

        <TextBox
          label="Documento de referencia"
          optional
          maxLength={40}
          placeholder="Ej. ACTA-0012"
          hint="El acta de conteo u otro documento que respalde el ajuste."
          error={errors.documentRef?.message}
          {...register('documentRef')}
        />

        <p className="rounded-xl bg-primary/5 px-4 py-3 text-xs text-muted">
          El ajuste queda en el historial como cualquier movimiento: no se edita ni se borra. Si te
          equivocas, se corrige con otro ajuste.
        </p>
      </form>
    </Modal>
  );
}

/** Corrects a product's stock in a warehouse (or a lot's) with the difference from a count. */
export function AdjustmentModal({ target, ...props }: AdjustmentModalProps) {
  if (!target) return null;
  return <AdjustmentForm target={target} {...props} />;
}
