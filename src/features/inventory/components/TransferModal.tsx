import { useEffect, useMemo } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { FiArrowRight, FiPlus, FiTrash2 } from 'react-icons/fi';
import { movementTypeLabel } from '@/shared/lib/movementTypes';
import { formatQuantity, unitLabel } from '@/shared/lib/units';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { FormSelect } from '@/shared/ui/components/form/FormSelect';
import { RadioGroup } from '@/shared/ui/components/form/RadioGroup';
import { TextArea } from '@/shared/ui/components/form/TextArea';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Modal } from '@/shared/ui/components/Modal';
import { useMovementTypes, useStockWarehouses } from '../api/inventory.queries';
import { useTransferForm } from '../hooks/useTransferForm';
import { EMPTY_TRANSFER_LINE, MAX_TRANSFER_LINES } from '../types/transfer.schema';
import type { RegisteredMovement, StockProduct } from '../types/inventory.types';

/** The product and warehouse being looked at, chosen beforehand; null: closed. */
export interface TransferTarget {
  productId: string | null;
  /** The origin: where the stock leaves from. */
  warehouseId: string | null;
}

interface TransferModalProps {
  target: TransferTarget | null;
  products: StockProduct[];
  onClose: () => void;
  onSaved: (movement: RegisteredMovement) => void;
}

const FORM_ID = 'transfer-form';

const formatDay = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(`${iso}T12:00:00`));

function TransferForm({
  target,
  products,
  onClose,
  onSaved,
}: Omit<TransferModalProps, 'target'> & { target: TransferTarget }) {
  const { form, lines, lineInfo, optionsFor, submit, canReceiveNow, isSubmitting, serverError } =
    useTransferForm({
      products,
      initialProductId: target.productId,
      initialOriginId: target.warehouseId,
      onSaved,
    });
  const {
    register,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = form;

  const originId = useWatch({ control, name: 'originId' });
  const destinationId = useWatch({ control, name: 'destinationId' });
  const warehouses = useStockWarehouses();
  const types = useMovementTypes(originId || null);

  // The transfer types the user's roles allow from the origin; usually only "Traslado".
  const reasons = useMemo(
    () => (types.data ?? []).filter((type) => type.nature === 'transfer'),
    [types.data],
  );
  useEffect(() => {
    if (!types.data) return;
    const current = getValues('movementTypeId');
    if (reasons.length === 1 && current !== reasons[0].id) {
      setValue('movementTypeId', reasons[0].id, { shouldValidate: true });
    } else if (current && !reasons.some((reason) => reason.id === current)) {
      setValue('movementTypeId', '');
    }
  }, [types.data, reasons, getValues, setValue]);

  const nameOf = (id: string) => warehouses.data?.find((warehouse) => warehouse.id === id)?.name;
  const originName = nameOf(originId);
  const destinationName = nameOf(destinationId);
  const noReasons = Boolean(originId) && types.isSuccess && reasons.length === 0;
  const tooFewWarehouses = warehouses.isSuccess && warehouses.data.length < 2;

  const originOptions = (warehouses.data ?? []).map((warehouse) => ({
    value: warehouse.id,
    label: warehouse.name,
    description: warehouse.code,
  }));
  const destinationOptions = originOptions.filter((option) => option.value !== originId);
  const productOptions = (index: number) =>
    optionsFor(index).map((candidate) => ({
      value: candidate.id,
      label: `${candidate.name} · ${candidate.sku}`,
      description: unitLabel(candidate.unit),
    }));
  const lineCount = lines.fields.length;

  return (
    <Modal
      title="Registrar traslado"
      description="Lo que pasa de un almacén a otro, uno o varios productos. Sale del origen al registrarlo y no puede ser más de lo que hay allí."
      onClose={onClose}
      dismissible={!isSubmitting}
      size="lg"
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
            disabled={noReasons || tooFewWarehouses}
          >
            Registrar traslado
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} noValidate className="space-y-5">
        {serverError && <Alert tone="danger">{serverError}</Alert>}
        {tooFewWarehouses && (
          <Alert tone="warning">
            Para trasladar necesitas al menos dos almacenes abiertos a los que tengas acceso.
          </Alert>
        )}

        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <FormSelect
            control={control}
            name="originId"
            label="Sale de"
            required
            placeholder={warehouses.isLoading ? 'Cargando almacenes…' : 'Almacén de origen'}
            options={originOptions}
            searchable
            searchPlaceholder="Buscar almacén…"
            emptyMessage="Ningún almacén coincide"
          />
          <FiArrowRight aria-hidden className="mx-auto hidden size-5 text-muted sm:mt-9 sm:block" />
          <FormSelect
            control={control}
            name="destinationId"
            label="Va a"
            required
            disabled={!originId}
            placeholder={originId ? 'Almacén de destino' : 'Primero elige el origen'}
            options={destinationOptions}
            searchable
            searchPlaceholder="Buscar almacén…"
            emptyMessage="Ningún almacén coincide"
          />
        </div>
        {noReasons && (
          <Alert tone="warning">
            Tus roles en {originName ?? 'este almacén'} no permiten registrar traslados.
          </Alert>
        )}
        {reasons.length > 1 && (
          <FormSelect
            control={control}
            name="movementTypeId"
            label="Motivo"
            required
            placeholder="Elige el motivo"
            options={reasons.map((reason) => ({
              value: reason.id,
              label: movementTypeLabel(reason),
            }))}
          />
        )}

        <section aria-labelledby="transfer-lines" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 id="transfer-lines" className="text-sm font-bold text-fg">
              Productos
            </h3>
            <span className="text-xs text-muted">
              {lineCount === 1 ? '1 producto' : `${lineCount} productos`}
            </span>
          </div>
          {errors.lines?.root?.message && (
            <p role="alert" className="text-xs text-danger">
              {errors.lines.root.message}
            </p>
          )}
          <ol className="space-y-3">
            {lines.fields.map((field, index) => {
              const { product, available, lots } = lineInfo[index] ?? {
                product: null,
                available: null,
                lots: null,
              };
              const lineErrors = errors.lines?.[index];
              return (
                <li
                  key={field.id}
                  className="grid grid-cols-1 items-start gap-3 rounded-xl bg-canvas p-3 sm:grid-cols-2"
                >
                  <FormSelect
                    control={control}
                    name={`lines.${index}.productId`}
                    aria-label={`Producto ${index + 1}`}
                    placeholder="Busca por código o nombre"
                    options={productOptions(index)}
                    searchable
                    searchPlaceholder="Código o nombre…"
                    emptyMessage="Ningún producto coincide"
                  />
                  {/* The quantity, with the button that removes the line beside it. */}
                  <div className="flex items-start gap-2">
                    <TextBox
                      aria-label={`Cantidad ${index + 1}`}
                      inputMode="decimal"
                      placeholder="Cantidad"
                      trailing={
                        product ? (
                          <span className="text-xs text-muted">
                            {unitLabel(product.unit).toLowerCase()}
                          </span>
                        ) : undefined
                      }
                      hint={
                        product && available !== null && originName
                          ? lots?.chosen
                            ? `Disponible en el lote ${lots.chosen.code}: ${formatQuantity(available, product.unit)}.`
                            : `Disponible en ${originName}: ${formatQuantity(available, product.unit)}.`
                          : undefined
                      }
                      error={lineErrors?.quantity?.message}
                      containerClassName="min-w-0 flex-1"
                      {...register(`lines.${index}.quantity`)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => lines.remove(index)}
                      disabled={lineCount === 1}
                      aria-label={`Quitar el producto ${index + 1}`}
                      title={lineCount === 1 ? 'Debe quedar al menos un producto' : 'Quitar'}
                      className="mt-1 text-danger hover:bg-danger/10"
                    >
                      <FiTrash2 aria-hidden className="size-4" />
                    </Button>
                  </div>
                  {lots && (
                    <FormSelect
                      control={control}
                      name={`lines.${index}.lotCode`}
                      aria-label={`Lote ${index + 1}`}
                      disabled={!originId}
                      placeholder={
                        !originId
                          ? 'Primero elige el origen'
                          : lots.isLoading
                            ? 'Cargando lotes…'
                            : lots.items.length > 0
                              ? 'Elige el lote'
                              : 'No hay lotes con existencia allí'
                      }
                      options={lots.items.map((lot) => ({
                        value: lot.code,
                        label: lot.code,
                        description: [
                          product ? formatQuantity(lot.onHand, product.unit) : null,
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
                </li>
              );
            })}
          </ol>
          <Button
            variant="outline"
            size="sm"
            onClick={() => lines.append(EMPTY_TRANSFER_LINE)}
            disabled={lineCount >= MAX_TRANSFER_LINES}
            className="gap-1"
          >
            <FiPlus aria-hidden className="size-4" /> Añadir producto
          </Button>
        </section>

        <Controller
          control={control}
          name="arrival"
          render={({ field }) => (
            <RadioGroup
              legend="¿Cómo llega?"
              value={field.value}
              onChange={field.onChange}
              options={[
                {
                  value: 'transit',
                  label: 'Queda en camino',
                  description: `Sale ahora de ${originName ?? 'el origen'} y ${destinationName ?? 'el destino'} lo suma cuando lo reciba y confirme cuánto llegó.`,
                },
                {
                  value: 'now',
                  label: 'Ya llegó',
                  description: canReceiveNow
                    ? `Se suma de una vez en ${destinationName ?? 'el destino'}. Úsalo cuando el producto ya está allí.`
                    : destinationId
                      ? `Necesitas permiso para recibir en ${destinationName ?? 'el destino'}.`
                      : 'Primero elige el destino.',
                  disabled: !canReceiveNow,
                },
              ]}
            />
          )}
        />

        <TextBox
          label="Documento de referencia"
          optional
          maxLength={40}
          placeholder="Ej. REM-208"
          hint="La remisión u otro documento que acompaña el traslado."
          error={errors.documentRef?.message}
          {...register('documentRef')}
        />
        <TextArea
          label="Notas"
          optional
          rows={2}
          maxLength={2000}
          placeholder="Ej. Va en el camión de las 3 p. m."
          error={errors.notes?.message}
          {...register('notes')}
        />

        <p className="rounded-xl bg-primary/5 px-4 py-3 text-xs text-muted">
          Un traslado no cuenta como demanda y no se edita ni se borra. Mientras va en camino, el
          producto no está disponible en ningún almacén.
        </p>
      </form>
    </Modal>
  );
}

/** CU-16: one or more products from one warehouse to another. */
export function TransferModal({ target, ...props }: TransferModalProps) {
  if (!target) return null;
  return <TransferForm target={target} {...props} />;
}
