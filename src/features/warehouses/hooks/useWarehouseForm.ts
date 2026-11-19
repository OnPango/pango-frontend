import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { getApiErrorCode } from '@/core/api/errors';
import { useCreateWarehouse, useUpdateWarehouse } from '../api/warehouses.queries';
import { warehousesErrorMessage } from '../content/warehouses.errors';
import type {
  CreateWarehouseInput,
  UpdateWarehouseInput,
  Warehouse,
} from '../types/warehouses.types';
import {
  EMPTY_WAREHOUSE_FORM,
  toWarehouseFormValues,
  warehouseSchema,
  type WarehouseFormValues,
} from '../types/warehouse.schema';

/** API errors shown on their field instead of the banner. */
const FIELD_ERRORS = {
  WAREHOUSE_NAME_TAKEN: 'name',
  WAREHOUSE_CODE_TAKEN: 'code',
} as const satisfies Record<string, keyof WarehouseFormValues>;

const fieldOf = (error: unknown) => {
  const code = getApiErrorCode(error);
  return code && code in FIELD_ERRORS ? FIELD_ERRORS[code as keyof typeof FIELD_ERRORS] : null;
};

const toInput = (values: WarehouseFormValues): CreateWarehouseInput => ({
  name: values.name.trim(),
  code: values.code.trim(),
  type: values.type,
  address: values.address.trim() || null,
  holdsStock: values.holdsStock,
});

/** The fields of `next` that differ from `saved`, so an edit only sends what changed. */
function changes(saved: CreateWarehouseInput, next: CreateWarehouseInput): UpdateWarehouseInput {
  const diff: UpdateWarehouseInput = {};
  for (const key of Object.keys(next) as (keyof CreateWarehouseInput)[]) {
    if (saved[key] !== next[key]) Object.assign(diff, { [key]: next[key] });
  }
  return diff;
}

/** State and rules of the warehouse form, to register one or edit `warehouse`. */
export function useWarehouseForm({
  warehouse,
  onSaved,
}: {
  warehouse?: Warehouse;
  onSaved: (warehouse: Warehouse) => void;
}) {
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const mutation = warehouse ? updateWarehouse : createWarehouse;

  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    mode: 'onTouched',
    defaultValues: warehouse ? toWarehouseFormValues(warehouse) : EMPTY_WAREHOUSE_FORM,
  });

  const onError = (error: unknown) => {
    const field = fieldOf(error);
    if (field) {
      const message = warehousesErrorMessage(error, 'No se pudo guardar el almacén.');
      form.setError(field, { message }, { shouldFocus: true });
    }
  };

  const submit = form.handleSubmit((values) => {
    const input = toInput(values);
    if (!warehouse) {
      createWarehouse.mutate(input, { onSuccess: onSaved, onError });
      return;
    }
    const diff = changes(toInput(toWarehouseFormValues(warehouse)), input);
    if (Object.keys(diff).length === 0) {
      onSaved(warehouse);
      return;
    }
    updateWarehouse.mutate({ id: warehouse.id, input: diff }, { onSuccess: onSaved, onError });
  });

  return {
    form,
    submit,
    isSubmitting: mutation.isPending,
    /** Errors that are not about one field (permissions, network…). */
    serverError:
      mutation.isError && !fieldOf(mutation.error)
        ? warehousesErrorMessage(mutation.error, 'No se pudo guardar el almacén.')
        : null,
  };
}
