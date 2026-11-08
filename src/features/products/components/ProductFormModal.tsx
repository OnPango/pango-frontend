import { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { FiLock } from 'react-icons/fi';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { FormSelect } from '@/shared/ui/components/form/FormSelect';
import { RadioGroup } from '@/shared/ui/components/form/RadioGroup';
import { TextArea } from '@/shared/ui/components/form/TextArea';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Modal } from '@/shared/ui/components/Modal';
import { useProduct } from '../api/products.queries';
import { toCategorySelectOptions, unitLabel } from '../content/catalog.labels';
import { useProductForm } from '../hooks/useProductForm';
import { useVolumeCalculation } from '../hooks/useVolumeCalculation';
import type { ProductFormValues } from '../types/product.schema';
import type { Product, ProductCategory, UnitOfMeasure } from '../types/products.types';
import { NewCategoryInline } from './NewCategoryInline';

interface ProductFormModalProps {
  isOpen: boolean;
  /** The product to edit. Without it, the form registers a new one. */
  product?: Product | null;
  onClose: () => void;
  onSaved: (product: Product) => void;
  categories: ProductCategory[];
  units: UnitOfMeasure[];
  /** With `category.manage` the form can create a family on the spot. */
  canCreateCategory: boolean;
}

const TRACKING_OPTIONS = [
  {
    value: 'quantity',
    label: 'Solo cantidad',
    description: 'Solo importa cuántas unidades hay. Para cosas baratas y de alta rotación.',
  },
  {
    value: 'lot',
    label: 'Por lote',
    description:
      'Un código de lote cubre varias unidades. Cada entrada o salida pide el lote. Ideal para tornillos, guantes, cintas.',
  },
];

const MEASURES: { name: keyof ProductFormValues; label: string; unit: string }[] = [
  { name: 'lengthCm', label: 'Largo', unit: 'cm' },
  { name: 'widthCm', label: 'Ancho', unit: 'cm' },
  { name: 'heightCm', label: 'Alto', unit: 'cm' },
  { name: 'weightKg', label: 'Peso', unit: 'kg' },
  { name: 'volumeL', label: 'Volumen', unit: 'L' },
];

const FORM_ID = 'product-form';

/**
 * Whether the code and the tracking of the product being edited can still change: they lock once
 * it has movements, and only `GET /products/:id` says so. Until it answers, they stay locked.
 */
function useLock(product: Product | undefined) {
  const detail = useProduct(product?.id ?? null);
  if (!product) return { locked: false, hasMovements: false, reason: null };
  if (detail.data) {
    return {
      locked: detail.data.hasMovements,
      hasMovements: detail.data.hasMovements,
      reason: detail.data.hasMovements
        ? 'Ya no se puede cambiar: el producto tiene movimientos.'
        : null,
    };
  }
  return {
    locked: true,
    hasMovements: false,
    reason: detail.isError
      ? 'No se pudo comprobar si el producto tiene movimientos; por ahora no se puede cambiar.'
      : 'Comprobando si el producto tiene movimientos…',
  };
}

function ProductFormContent({
  product,
  onClose,
  onSaved,
  categories,
  units,
  canCreateCategory,
}: Omit<ProductFormModalProps, 'isOpen' | 'product'> & { product?: Product }) {
  const isEdit = product !== undefined;
  const { form, submit, isSubmitting, serverError } = useProductForm({ product, onSaved });
  const {
    register,
    control,
    setValue,
    formState: { errors, isDirty },
  } = form;
  const lock = useLock(product);

  const { suggestedVolume, onVolumeChange, applySuggestedVolume, canApplySuggested } =
    useVolumeCalculation(form);

  // A product needs an active family; inactive ones only keep the products they already had.
  const categoryOptions = useMemo(
    () => toCategorySelectOptions(categories, { onlyActive: true, keepId: product?.category.id }),
    [categories, product?.category.id],
  );

  const unitOptions = units.map((unit) => ({
    value: unit.id,
    label: unitLabel(unit),
    description: unit.code,
  }));

  return (
    <Modal
      title={isEdit ? 'Editar producto' : 'Nuevo producto'}
      description={
        isEdit
          ? `${product.name} · ${product.sku}`
          : 'Completa lo básico. Lo demás lo puedes ajustar después.'
      }
      size="lg"
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
            disabled={isEdit && !isDirty}
          >
            {isEdit ? 'Guardar cambios' : 'Guardar producto'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} noValidate className="space-y-6">
        {serverError && <Alert tone="danger">{serverError}</Alert>}

        <section aria-labelledby="product-data" className="space-y-4">
          <h3 id="product-data" className="text-sm font-bold text-fg">
            Datos del producto
          </h3>
          <TextBox
            label="Nombre"
            required
            maxLength={150}
            placeholder="Ej. Tornillo hexagonal 1/4"
            error={errors.name?.message}
            {...register('name')}
          />
          <TextBox
            label="Código"
            required
            maxLength={40}
            placeholder="Ej. TOR-001"
            readOnly={lock.locked}
            trailing={
              lock.locked ? <FiLock aria-hidden className="size-4 text-muted" /> : undefined
            }
            hint={
              lock.reason ??
              'Único en la organización. Puedes cambiarlo hasta que el producto tenga movimientos.'
            }
            error={errors.sku?.message}
            {...register('sku')}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FormSelect
                control={control}
                name="categoryId"
                label="Familia"
                required
                placeholder={
                  categoryOptions.length > 0 ? 'Elige una familia' : 'Aún no hay familias'
                }
                options={categoryOptions}
                searchable
                searchPlaceholder="Buscar familia…"
                emptyMessage="Ninguna familia coincide"
              />
              {canCreateCategory && (
                <NewCategoryInline
                  onCreated={(category) =>
                    setValue('categoryId', category.id, { shouldValidate: true, shouldDirty: true })
                  }
                />
              )}
            </div>
            <FormSelect
              control={control}
              name="stockUnitId"
              label="Unidad de medida"
              required
              placeholder="Elige una unidad"
              hint={
                lock.hasMovements
                  ? 'Tiene movimientos: cambiarla no convierte las cantidades ya registradas.'
                  : 'En ella se cuentan la existencia, los movimientos y las solicitudes.'
              }
              options={unitOptions}
              searchable
              searchPlaceholder="Buscar unidad…"
              emptyMessage="Ninguna unidad coincide"
            />
          </div>
          <TextArea
            label="Descripción"
            optional
            maxLength={2000}
            hint="Ayuda a que otra persona lo reconozca."
            error={errors.description?.message}
            {...register('description')}
          />
        </section>

        <section aria-labelledby="product-tracking" className="space-y-3">
          <h3 id="product-tracking" className="text-sm font-bold text-fg">
            Cómo se identifica cada unidad
          </h3>
          <Controller
            control={control}
            name="tracking"
            render={({ field }) => (
              <RadioGroup
                legend="Seguimiento"
                options={TRACKING_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                disabled={lock.locked}
              />
            )}
          />
          {errors.tracking?.message ? (
            <p role="alert" className="text-xs text-danger">
              {errors.tracking.message}
            </p>
          ) : (
            <p className="text-xs text-muted">
              {lock.reason ??
                'El seguimiento no se puede cambiar cuando el producto ya tiene movimientos.'}
            </p>
          )}
        </section>

        <section aria-labelledby="product-measures" className="space-y-3">
          <div>
            <h3 id="product-measures" className="text-sm font-bold text-fg">
              Medidas <span className="font-normal text-muted">(opcional)</span>
            </h3>
            <p className="text-xs text-muted">Siempre en centímetros, kilogramos y litros.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {MEASURES.map((measure) => {
              const isVolume = measure.name === 'volumeL';
              const registerProps = register(measure.name);
              return (
                <div key={measure.name} className="flex flex-col gap-1">
                  <TextBox
                    label={measure.label}
                    inputMode="decimal"
                    placeholder="0"
                    trailing={<span className="text-xs text-muted">{measure.unit}</span>}
                    error={errors[measure.name]?.message}
                    {...registerProps}
                    onChange={(e) => {
                      void registerProps.onChange(e);
                      if (isVolume) onVolumeChange(e.target.value);
                    }}
                  />
                  {isVolume && canApplySuggested && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={applySuggestedVolume}
                      className="self-start px-1 py-0.5 text-[11px] font-medium text-primary"
                    >
                      Usar calculado ({suggestedVolume} L)
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {!isEdit && (
          <p className="rounded-xl bg-primary/5 px-4 py-3 text-xs text-muted">
            El producto empieza sin existencia. La existencia inicial se carga con una entrada de
            inventario.
          </p>
        )}
      </form>
    </Modal>
  );
}

/** "Nuevo producto" and "Editar producto": the same form, filled with `product` when editing. */
export function ProductFormModal({ isOpen, product, ...props }: ProductFormModalProps) {
  if (!isOpen) return null;
  return (
    <ProductFormContent key={product?.id ?? 'new'} product={product ?? undefined} {...props} />
  );
}
