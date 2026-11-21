import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { getApiErrorCode } from '@/core/api/errors';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasPermissionIn } from '@/core/auth/permissions';
import { formatQuantity } from '@/shared/lib/units';
import { useProductLots, useProductStock, useRegisterTransfer } from '../api/inventory.queries';
import { inventoryErrorMessage } from '../content/inventory.errors';
import type { RegisteredMovement, StockProduct } from '../types/inventory.types';
import { toQuantity } from '../types/movement.schema';
import { transferSchema, type TransferFormValues } from '../types/transfer.schema';

/** API errors shown on their field instead of the banner. */
const FIELD_ERRORS = {
  INSUFFICIENT_STOCK: 'quantity',
  LOT_REQUIRED: 'lotCode',
  LOT_NOT_ALLOWED: 'lotCode',
  LOT_NOT_FOUND: 'lotCode',
  PRODUCT_INVALID: 'productId',
  WAREHOUSE_INVALID: 'originId',
  DESTINATION_WAREHOUSE_REQUIRED: 'destinationId',
  DESTINATION_WAREHOUSE_INVALID: 'destinationId',
  SAME_WAREHOUSE: 'destinationId',
  MOVEMENT_TYPE_INVALID: 'movementTypeId',
  MOVEMENT_TYPE_NOT_ALLOWED: 'movementTypeId',
} as const satisfies Record<string, keyof TransferFormValues>;

const fieldOf = (error: unknown) => {
  const code = getApiErrorCode(error);
  return code && code in FIELD_ERRORS ? FIELD_ERRORS[code as keyof typeof FIELD_ERRORS] : null;
};

/**
 * State and rules of "Registrar traslado" (CU-16): the stock the origin has (a transfer takes it
 * out like an outbound movement), its lots, whether it may arrive at once (`movement.receive` in
 * the destination) and which API errors belong to a field.
 */
export function useTransferForm({
  products,
  initialProductId,
  initialOriginId,
  onSaved,
}: {
  products: StockProduct[];
  initialProductId: string | null;
  initialOriginId: string | null;
  onSaved: (movement: RegisteredMovement) => void;
}) {
  const user = useAuthStore((state) => state.user);
  const register = useRegisterTransfer();

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    mode: 'onTouched',
    defaultValues: {
      originId: initialOriginId ?? '',
      destinationId: '',
      movementTypeId: '',
      productId: initialProductId ?? '',
      quantity: '',
      lotCode: '',
      arrival: 'transit',
      documentRef: '',
      notes: '',
    },
  });

  const productId = useWatch({ control: form.control, name: 'productId' });
  const originId = useWatch({ control: form.control, name: 'originId' });
  const destinationId = useWatch({ control: form.control, name: 'destinationId' });
  const arrival = useWatch({ control: form.control, name: 'arrival' });
  const product = products.find((candidate) => candidate.id === productId) ?? null;

  const stock = useProductStock(productId || null);
  const inOrigin =
    product && originId && stock.data?.product.id === productId
      ? (stock.data.warehouses.find((row) => row.warehouse.id === originId)?.onHand ?? 0)
      : null;

  // Like an outbound movement, a per-lot product leaves from one of the lots the origin holds.
  const picksLot = Boolean(product?.tracksLots);
  const lots = useProductLots(picksLot ? productId : null, picksLot && originId ? originId : null);
  const lotCode = useWatch({ control: form.control, name: 'lotCode' });
  const lot = picksLot
    ? (lots.data?.find((candidate) => candidate.code === lotCode) ?? null)
    : null;
  /** What can leave: the chosen lot's stock, or the origin's. */
  const available = lot ? lot.onHand : inOrigin;

  /** Nobody else confirms what arrived, so arriving at once needs the right to receive there. */
  const canReceiveNow =
    Boolean(destinationId) && hasPermissionIn(user, 'movement.receive', destinationId);

  // A lot that is not in the new origin (or product) cannot stay chosen.
  useEffect(() => {
    if (!picksLot || !lots.data) return;
    const current = form.getValues('lotCode');
    if (current && !lots.data.some((candidate) => candidate.code === current)) {
      form.setValue('lotCode', '');
    }
  }, [picksLot, lots.data, form]);

  // The destination cannot be the origin; nor can it arrive at once where the user cannot receive.
  useEffect(() => {
    if (originId && form.getValues('destinationId') === originId)
      form.setValue('destinationId', '');
  }, [originId, form]);
  useEffect(() => {
    if (arrival === 'now' && !canReceiveNow) form.setValue('arrival', 'transit');
  }, [arrival, canReceiveNow, form]);

  const submit = form.handleSubmit((values) => {
    const quantity = toQuantity(values.quantity);
    if (product?.tracksLots && !values.lotCode.trim()) {
      form.setError('lotCode', {
        message: 'Este producto se sigue por lote: elige el lote que sale.',
      });
      return;
    }
    if (product && available !== null && quantity > available) {
      form.setError(
        'quantity',
        {
          message:
            available === 0
              ? 'No hay existencia de este producto en el almacén de origen.'
              : lot
                ? `Solo hay ${formatQuantity(available, product.unit)} en el lote ${lot.code}.`
                : `Solo hay ${formatQuantity(available, product.unit)} en el almacén de origen.`,
        },
        { shouldFocus: true },
      );
      return;
    }
    register.mutate(
      {
        movementTypeId: values.movementTypeId,
        originId: values.originId,
        destinationId: values.destinationId,
        productId: values.productId,
        quantity,
        lotCode: product?.tracksLots ? values.lotCode : null,
        receiveNow: values.arrival === 'now' && canReceiveNow,
        documentRef: values.documentRef || null,
        notes: values.notes || null,
      },
      {
        onSuccess: onSaved,
        onError: (error) => {
          const field = fieldOf(error);
          if (field) {
            const message = inventoryErrorMessage(error, 'No se pudo registrar el traslado.');
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
    canReceiveNow,
    lots: picksLot ? { items: lots.data ?? [], isLoading: lots.isLoading, chosen: lot } : null,
    isSubmitting: register.isPending,
    serverError:
      register.isError && !fieldOf(register.error)
        ? inventoryErrorMessage(register.error, 'No se pudo registrar el traslado.')
        : null,
  };
}
