import { useEffect, useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { formatQuantity, unitLabel } from '@/shared/lib/units';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { FormSelect } from '@/shared/ui/components/form/FormSelect';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Modal } from '@/shared/ui/components/Modal';
import { useMovementTypes, useStockWarehouses } from '../api/inventory.queries';
import { movementTypeDescription, movementTypeLabel } from '@/shared/lib/movementTypes';
import { KIND_LABELS } from '../content/movement.labels';
import { useMovementForm } from '../hooks/useMovementForm';
import type { MovementKind, RegisteredMovement, StockProduct } from '../types/inventory.types';

interface MovementModalProps {
  /** Null: closed. */
  kind: MovementKind | null;
  products: StockProduct[];
  /** The product and warehouse being looked at, chosen beforehand. */
  initialProductId: string | null;
  initialWarehouseId: string | null;
  onClose: () => void;
  onSaved: (movement: RegisteredMovement) => void;
}

const FORM_ID = 'movement-form';

const formatDay = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(`${iso}T12:00:00`));

function MovementForm({
  kind,
  products,
  initialProductId,
  initialWarehouseId,
  onClose,
  onSaved,
}: Omit<MovementModalProps, 'kind'> & { kind: MovementKind }) {
  const { form, submit, product, available, lots, isSubmitting, serverError } = useMovementForm({
    kind,
    products,
    initialProductId,
    initialWarehouseId,
    onSaved,
  });
  const {
    register,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = form;

  const warehouseId = useWatch({ control, name: 'warehouseId' });
  const warehouses = useStockWarehouses();
  const types = useMovementTypes(warehouseId || null);

  // Only the reasons of this kind that the user's roles allow in the chosen warehouse.
  const reasons = useMemo(
    () => (types.data ?? []).filter((type) => type.nature === kind),
    [types.data, kind],
  );

  // A reason that is not offered in the new warehouse is cleared; a single one is chosen for you.
  useEffect(() => {
    if (!types.data) return;
    const current = getValues('movementTypeId');
    if (reasons.length === 1 && current !== reasons[0].id) {
      setValue('movementTypeId', reasons[0].id, { shouldValidate: true });
    } else if (current && !reasons.some((reason) => reason.id === current)) {
      setValue('movementTypeId', '');
    }
  }, [types.data, reasons, getValues, setValue]);

  const warehouseOptions = (warehouses.data ?? []).map((warehouse) => ({
    value: warehouse.id,
    label: warehouse.name,
    description: warehouse.code,
  }));
  const reasonOptions = reasons.map((reason) => ({
    value: reason.id,
    label: movementTypeLabel(reason),
    description: movementTypeDescription(reason),
  }));
  const productOptions = products.map((candidate) => ({
    // The search box filters by label: code and name both match.
    value: candidate.id,
    label: `${candidate.name} · ${candidate.sku}`,
    description: unitLabel(candidate.unit),
  }));

  const warehouseName = warehouses.data?.find((warehouse) => warehouse.id === warehouseId)?.name;
  const noReasons = Boolean(warehouseId) && types.isSuccess && reasons.length === 0;

  return (
    <Modal
      title={KIND_LABELS[kind].title}
      description={
        kind === 'inbound'
          ? 'Lo que llega a un almacén. La existencia sube al registrarla.'
          : 'Lo que sale de un almacén. No puede ser más de lo que hay.'
      }
      onClose={onClose}
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={noReasons}
          >
            {KIND_LABELS[kind].title}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} noValidate className="space-y-5">
        {serverError && <Alert tone="danger">{serverError}</Alert>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect
            control={control}
            name="warehouseId"
            label="Almacén"
            required
            placeholder={
              warehouseOptions.length > 0 ? 'Elige el almacén' : 'No hay almacenes abiertos'
            }
            options={warehouseOptions}
            searchable
            searchPlaceholder="Buscar almacén…"
            emptyMessage="Ningún almacén coincide"
          />
          <FormSelect
            control={control}
            name="movementTypeId"
            label="Motivo"
            required
            disabled={!warehouseId || noReasons}
            placeholder={warehouseId ? 'Elige el motivo' : 'Primero elige el almacén'}
            options={reasonOptions}
          />
        </div>
        {noReasons && (
          <Alert tone="warning">
            Tus roles en {warehouseName ?? 'este almacén'} no permiten registrar{' '}
            {kind === 'inbound' ? 'entradas' : 'salidas'}.
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextBox
            label="Cantidad"
            required
            inputMode="decimal"
            placeholder="0"
            trailing={
              product ? (
                <span className="text-xs text-muted">{unitLabel(product.unit).toLowerCase()}</span>
              ) : undefined
            }
            hint={
              product && available !== null && warehouseName
                ? lots?.chosen
                  ? `Disponible en el lote ${lots.chosen.code}: ${formatQuantity(available, product.unit)}.`
                  : `${kind === 'outbound' ? 'Disponible' : 'Hay'} en ${warehouseName}: ${formatQuantity(available, product.unit)}.`
                : undefined
            }
            error={errors.quantity?.message}
            {...register('quantity')}
          />
          {product?.tracksLots && lots && (
            <FormSelect
              control={control}
              name="lotCode"
              label="Lote"
              required
              disabled={!warehouseId}
              placeholder={
                !warehouseId
                  ? 'Primero elige el almacén'
                  : lots.isLoading
                    ? 'Cargando lotes…'
                    : lots.items.length > 0
                      ? 'Elige el lote'
                      : 'No hay lotes con existencia aquí'
              }
              hint="Los lotes con existencia en este almacén; primero los que vencen antes."
              options={lots.items.map((lot) => ({
                value: lot.code,
                label: lot.code,
                description: [
                  formatQuantity(lot.onHand, product.unit),
                  lot.expiryDate ? `vence el ${formatDay(lot.expiryDate)}` : null,
                ]
                  .filter(Boolean)
                  .join(' · '),
              }))}
              searchable
              searchPlaceholder="Buscar lote…"
              emptyMessage="Ningún lote coincide"
            />
          )}
          {product?.tracksLots && !lots && (
            <TextBox
              label="Lote"
              required
              maxLength={40}
              placeholder="Ej. L-2026-11"
              hint="Si el lote no existe todavía, se crea."
              error={errors.lotCode?.message}
              {...register('lotCode')}
            />
          )}
        </div>

        <TextBox
          label="Documento de referencia"
          optional
          maxLength={40}
          placeholder={kind === 'inbound' ? 'Ej. FAC-1043' : 'Ej. REM-208'}
          hint="Factura, remisión u otro documento que respalde el movimiento."
          error={errors.documentRef?.message}
          {...register('documentRef')}
        />

        <p className="rounded-xl bg-primary/5 px-4 py-3 text-xs text-muted">
          Un movimiento registrado no se edita ni se borra. Si te equivocas, se corrige con otro
          movimiento.
        </p>
      </form>
    </Modal>
  );
}

/** CU-05: one product, one warehouse, one quantity. */
export function MovementModal({ kind, ...props }: MovementModalProps) {
  if (!kind) return null;
  return <MovementForm key={kind} kind={kind} {...props} />;
}
