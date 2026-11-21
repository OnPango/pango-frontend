import { Controller, useWatch } from 'react-hook-form';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { unitLabel } from '@/shared/lib/units';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { DatePicker } from '@/shared/ui/components/form/date/DatePicker';
import { FormSelect } from '@/shared/ui/components/form/FormSelect';
import { TextArea } from '@/shared/ui/components/form/TextArea';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Modal } from '@/shared/ui/components/Modal';
import { PRIORITY_LABELS, today } from '../content/request.labels';
import { useRequestForm } from '../hooks/useRequestForm';
import type { Option, RequestableProduct, StockRequest } from '../types/requests.types';
import { EMPTY_LINE, MAX_LINES } from '../types/request.schema';

interface NewRequestModalProps {
  isOpen: boolean;
  /** The requesting area: the user's. `undefined`: not known here, the API assigns it. */
  department: Option | undefined;
  /** Warehouses where the user may create requests. */
  warehouses: Option[];
  products: RequestableProduct[];
  onClose: () => void;
  onCreated: (request: StockRequest) => void;
}

const FORM_ID = 'request-form';

const PRIORITY_OPTIONS = ([1, 2, 3] as const).map((value) => ({
  value: String(value),
  label: PRIORITY_LABELS[value],
}));

function NewRequestForm({
  department,
  warehouses,
  products,
  onClose,
  onCreated,
}: Omit<NewRequestModalProps, 'isOpen'>) {
  const { form, lines, submit, isSubmitting, serverError } = useRequestForm({
    initialWarehouseId: warehouses.length === 1 ? warehouses[0].id : null,
    onCreated,
  });
  const {
    control,
    register,
    formState: { errors },
  } = form;
  const chosen = useWatch({ control, name: 'lines' });

  const productById = new Map(products.map((product) => [product.id, product]));
  // A product already in another line is not offered again (PRODUCT_DUPLICATED).
  const optionsFor = (index: number) => {
    const taken = new Set(
      chosen.filter((_, other) => other !== index).map((line) => line.productId),
    );
    return products
      .filter((product) => !taken.has(product.id))
      .map((product) => ({
        value: product.id,
        label: `${product.name} · ${product.sku}`,
        description: unitLabel(product.unit),
      }));
  };

  const warehouseOptions = warehouses.map((warehouse) => ({
    value: warehouse.id,
    label: warehouse.name,
  }));

  return (
    <Modal
      title="Nueva solicitud"
      description="Pide productos a un almacén. Queda pendiente hasta que el almacén la atienda; el inventario no cambia todavía."
      size="lg"
      onClose={onClose}
      dismissible={!isSubmitting}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} variant="primary" size="sm" isLoading={isSubmitting}>
            Enviar solicitud
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} noValidate className="space-y-6">
        {serverError && <Alert tone="danger">{serverError}</Alert>}

        <section aria-labelledby="request-header" className="space-y-4">
          <h3 id="request-header" className="sr-only">
            Datos de la solicitud
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-fg">Área solicitante</span>
              <p className="rounded-xl border border-line2 bg-canvas px-3.5 py-2.5 text-sm text-fg">
                {department ? department.name : 'Tu área'}
              </p>
              <p className="text-xs text-muted">
                {department
                  ? 'La solicitud sale a nombre de tu área.'
                  : 'Se asigna la tuya al enviar.'}
              </p>
            </div>
            <FormSelect
              control={control}
              name="warehouseId"
              label="Almacén que atiende"
              required
              placeholder={
                warehouseOptions.length > 0 ? 'Elige el almacén' : 'No tienes almacenes disponibles'
              }
              options={warehouseOptions}
              searchable
              searchPlaceholder="Buscar almacén…"
              emptyMessage="Ningún almacén coincide"
            />
            <FormSelect
              control={control}
              name="priority"
              label="Prioridad"
              required
              options={PRIORITY_OPTIONS}
            />
            <Controller
              control={control}
              name="requiredDate"
              render={({ field }) => (
                <DatePicker
                  label="Fecha en que se necesita"
                  optional
                  value={field.value}
                  onChange={field.onChange}
                  min={today()}
                  clearable
                />
              )}
            />
          </div>
        </section>

        <section aria-labelledby="request-lines" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 id="request-lines" className="text-sm font-bold text-fg">
              Productos
            </h3>
            <span className="text-xs text-muted">
              {lines.fields.length === 1 ? '1 producto' : `${lines.fields.length} productos`}
            </span>
          </div>
          {errors.lines?.root?.message && (
            <p role="alert" className="text-xs text-danger">
              {errors.lines.root.message}
            </p>
          )}
          <ol className="space-y-3">
            {lines.fields.map((field, index) => {
              const product = productById.get(chosen[index]?.productId ?? '');
              return (
                <li
                  key={field.id}
                  className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[1fr_10rem_auto]"
                >
                  <FormSelect
                    control={control}
                    name={`lines.${index}.productId`}
                    aria-label={`Producto ${index + 1}`}
                    placeholder="Busca por código o nombre"
                    options={optionsFor(index)}
                    searchable
                    searchPlaceholder="Código o nombre…"
                    emptyMessage="Ningún producto coincide"
                  />
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
                    error={errors.lines?.[index]?.quantity?.message}
                    {...register(`lines.${index}.quantity`)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => lines.remove(index)}
                    disabled={lines.fields.length === 1}
                    aria-label={`Quitar el producto ${index + 1}`}
                    title={
                      lines.fields.length === 1 ? 'Debe quedar al menos un producto' : 'Quitar'
                    }
                    className="mt-1 text-danger hover:bg-danger/10"
                  >
                    <FiTrash2 aria-hidden className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ol>
          <Button
            variant="outline"
            size="sm"
            onClick={() => lines.append(EMPTY_LINE)}
            disabled={lines.fields.length >= MAX_LINES || lines.fields.length >= products.length}
            className="gap-1"
          >
            <FiPlus aria-hidden className="size-4" /> Añadir producto
          </Button>
        </section>

        <TextArea
          label="Notas"
          optional
          maxLength={2000}
          placeholder="Para qué se necesita, a quién entregar…"
          error={errors.notes?.message}
          {...register('notes')}
        />
      </form>
    </Modal>
  );
}

/** US-028 / CU-08: an internal request with one or more products. */
export function NewRequestModal({ isOpen, ...props }: NewRequestModalProps) {
  if (!isOpen) return null;
  return <NewRequestForm {...props} />;
}
