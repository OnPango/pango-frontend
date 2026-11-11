import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { getApiErrorCode } from '@/core/api/errors';
import { formatQuantity } from '@/shared/lib/units';
import { useProductLots, useProductStock, useRegisterMovement } from '../api/inventory.queries';
import { inventoryErrorMessage } from '../content/inventory.errors';
import type { MovementKind, RegisteredMovement, StockProduct } from '../types/inventory.types';
import { movementSchema, toQuantity, type MovementFormValues } from '../types/movement.schema';

/** API errors shown on their field instead of the banner. */
const FIELD_ERRORS = {
  INSUFFICIENT_STOCK: 'quantity',
  LOT_REQUIRED: 'lotCode',
  LOT_NOT_ALLOWED: 'lotCode',
  LOT_NOT_FOUND: 'lotCode',
  PRODUCT_INVALID: 'productId',
  WAREHOUSE_INVALID: 'warehouseId',
  MOVEMENT_TYPE_INVALID: 'movementTypeId',
  MOVEMENT_TYPE_NOT_ALLOWED: 'movementTypeId',
  MOVEMENT_TYPE_NOT_SUPPORTED: 'movementTypeId',
} as const satisfies Record<string, keyof MovementFormValues>;

const fieldOf = (error: unknown) => {
  const code = getApiErrorCode(error);
  return code && code in FIELD_ERRORS ? FIELD_ERRORS[code as keyof typeof FIELD_ERRORS] : null;
};

/**
 * State and rules of "Registrar entrada" / "Registrar salida" (CU-05): validation, the stock the
 * chosen warehouse has, and which API errors belong to a field.
 */
export function useMovementForm({
  kind,
  products,
  initialProductId,
  initialWarehouseId,
  onSaved,
}: {
  kind: MovementKind;
  products: StockProduct[];
  initialProductId: string | null;
  initialWarehouseId: string | null;
  onSaved: (movement: RegisteredMovement) => void;
}) {
  const register = useRegisterMovement();

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    mode: 'onTouched',
    defaultValues: {
      warehouseId: initialWarehouseId ?? '',
      movementTypeId: '',
      productId: initialProductId ?? '',
      quantity: '',
      lotCode: '',
      documentRef: '',
    },
  });

  const productId = useWatch({ control: form.control, name: 'productId' });
  const warehouseId = useWatch({ control: form.control, name: 'warehouseId' });
  const product = products.find((candidate) => candidate.id === productId) ?? null;
  const stock = useProductStock(productId || null);
  /** On hand of the product in the chosen warehouse; null until both are known. */
  const inWarehouse =
    product && warehouseId && stock.data?.product.id === productId
      ? (stock.data.warehouses.find((row) => row.warehouse.id === warehouseId)?.onHand ?? 0)
      : null;

  // An outbound movement of a per-lot product takes stock from one lot: offer the lots with stock
  // in that warehouse instead of typing the code (an inbound one may bring a new lot, so it types).
  const picksLot = kind === 'outbound' && Boolean(product?.tracksLots);
  const lots = useProductLots(
    picksLot ? productId : null,
    picksLot && warehouseId ? warehouseId : null,
  );
  const lotCode = useWatch({ control: form.control, name: 'lotCode' });
  const lot = picksLot
    ? (lots.data?.find((candidate) => candidate.code === lotCode) ?? null)
    : null;
  /** What can go out: the chosen lot's stock, or the warehouse's. */
  const available = lot ? lot.onHand : inWarehouse;

  // A lot that is not in the new warehouse (or product) cannot stay chosen.
  useEffect(() => {
    if (!picksLot || !lots.data) return;
    const current = form.getValues('lotCode');
    if (current && !lots.data.some((candidate) => candidate.code === current)) {
      form.setValue('lotCode', '');
    }
  }, [picksLot, lots.data, form]);

  const submit = form.handleSubmit((values) => {
    const quantity = toQuantity(values.quantity);
    if (product?.tracksLots && !values.lotCode.trim()) {
      form.setError('lotCode', {
        message: picksLot
          ? 'Este producto se sigue por lote: elige el lote del que sale.'
          : 'Este producto se sigue por lote: escribe el lote.',
      });
      return;
    }
    // CU-05 step 4: an outbound movement cannot take more than the warehouse has.
    if (kind === 'outbound' && product && available !== null && quantity > available) {
      form.setError(
        'quantity',
        {
          message:
            available === 0
              ? 'No hay existencia de este producto en este almacén.'
              : lot
                ? `Solo hay ${formatQuantity(available, product.unit)} en el lote ${lot.code}.`
                : `Solo hay ${formatQuantity(available, product.unit)} en este almacén.`,
        },
        { shouldFocus: true },
      );
      return;
    }
    register.mutate(
      {
        movementTypeId: values.movementTypeId,
        warehouseId: values.warehouseId,
        productId: values.productId,
        quantity,
        lotCode: product?.tracksLots ? values.lotCode : null,
        documentRef: values.documentRef || null,
      },
      {
        onSuccess: onSaved,
        onError: (error) => {
          const field = fieldOf(error);
          if (field) {
            const message = inventoryErrorMessage(error, 'No se pudo registrar el movimiento.');
            form.setError(field, { message }, { shouldFocus: true });
          }
        },
      },
    );
  });

  return {
    form,
    submit,
    product,
    available,
    /** For outbound movements of per-lot products: the lots to choose from, and the chosen one. */
    lots: picksLot ? { items: lots.data ?? [], isLoading: lots.isLoading, chosen: lot } : null,
    isSubmitting: register.isPending,
    /** Errors that are not about one field (permissions, network…). */
    serverError:
      register.isError && !fieldOf(register.error)
        ? inventoryErrorMessage(register.error, 'No se pudo registrar el movimiento.')
        : null,
  };
}
