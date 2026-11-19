import { useEffect, useRef } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Checkbox } from '@/shared/ui/components/form/Checkbox';
import { RadioGroup } from '@/shared/ui/components/form/RadioGroup';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Modal } from '@/shared/ui/components/Modal';
import { suggestCode } from '../content/warehouse.labels';
import { useWarehouseForm } from '../hooks/useWarehouseForm';
import type { Warehouse } from '../types/warehouses.types';

interface WarehouseFormModalProps {
  isOpen: boolean;
  /** The warehouse to edit. Without it, the form registers a new one. */
  warehouse?: Warehouse | null;
  onClose: () => void;
  onSaved: (warehouse: Warehouse) => void;
}

const TYPE_OPTIONS = [
  {
    value: 'warehouse',
    label: 'Bodega',
    description: 'Guarda inventario: recibe, almacena y despacha.',
  },
  {
    value: 'store',
    label: 'Tienda',
    description: 'Punto de venta: lo que sale de aquí es lo que se vende o se consume.',
  },
];

const FORM_ID = 'warehouse-form';

function WarehouseFormContent({
  warehouse,
  onClose,
  onSaved,
}: Omit<WarehouseFormModalProps, 'isOpen' | 'warehouse'> & { warehouse?: Warehouse }) {
  const isEdit = warehouse !== undefined;
  const { form, submit, isSubmitting, serverError } = useWarehouseForm({ warehouse, onSaved });
  const {
    register,
    control,
    setValue,
    formState: { errors, isDirty },
  } = form;

  // A new warehouse gets a code proposed from its name and type until the user types one.
  const name = useWatch({ control, name: 'name' });
  const type = useWatch({ control, name: 'type' });
  const codeTypedByHand = useRef(isEdit);
  useEffect(() => {
    if (codeTypedByHand.current) return;
    setValue('code', suggestCode(name, type), { shouldDirty: true });
  }, [name, type, setValue]);

  const codeField = register('code');

  return (
    <Modal
      title={isEdit ? 'Editar almacén' : 'Nuevo almacén'}
      description={
        isEdit
          ? `${warehouse.name} · ${warehouse.code}`
          : 'Un lugar donde guardas inventario o lo vendes.'
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
            disabled={isEdit && !isDirty}
          >
            {isEdit ? 'Guardar cambios' : 'Crear almacén'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} noValidate className="space-y-5">
        {serverError && <Alert tone="danger">{serverError}</Alert>}

        <TextBox
          label="Nombre"
          required
          maxLength={80}
          placeholder="Ej. Bodega Norte"
          hint="Único en la organización."
          error={errors.name?.message}
          {...register('name')}
        />
        <TextBox
          label="Código"
          required
          maxLength={20}
          placeholder="Ej. BOD-NORTE"
          hint={
            isEdit
              ? 'Corto y único. Aparece en movimientos y reportes.'
              : 'Lo proponemos a partir del nombre; puedes cambiarlo.'
          }
          error={errors.code?.message}
          {...codeField}
          onChange={(e) => {
            codeTypedByHand.current = e.target.value.trim() !== '';
            void codeField.onChange(e);
          }}
        />
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <RadioGroup
              legend="Tipo"
              options={TYPE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <TextBox
          label="Dirección"
          optional
          maxLength={200}
          placeholder="Ej. Cra 50 # 80-20, Barranquilla"
          error={errors.address?.message}
          {...register('address')}
        />
        <Checkbox
          label="Guarda inventario propio"
          description="Desmárcalo si aquí nunca hay existencias, por ejemplo si vende sobre pedido. Sus productos quedan fuera del pronóstico de demanda."
          {...register('holdsStock')}
        />

        {!isEdit && (
          <p className="rounded-xl bg-primary/5 px-4 py-3 text-xs text-muted">
            Se crea con una ubicación principal: todo el inventario de este almacén va ahí hasta que
            definas estantes, racks o zonas.
          </p>
        )}
      </form>
    </Modal>
  );
}

/** "Nuevo almacén" and "Editar almacén": the same form, filled with `warehouse` when editing. */
export function WarehouseFormModal({ isOpen, warehouse, ...props }: WarehouseFormModalProps) {
  if (!isOpen) return null;
  return (
    <WarehouseFormContent
      key={warehouse?.id ?? 'new'}
      warehouse={warehouse ?? undefined}
      {...props}
    />
  );
}
