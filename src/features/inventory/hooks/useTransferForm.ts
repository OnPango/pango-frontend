import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useFieldArray, useForm, useWatch, type FieldPath } from 'react-hook-form';
import { getApiErrorCode, getApiErrorMessage } from '@/core/api/errors';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasPermissionIn } from '@/core/auth/permissions';
import { formatQuantity } from '@/shared/lib/units';
import { useLinesStock, useRegisterTransfer } from '../api/inventory.queries';
import { inventoryErrorMessage } from '../content/inventory.errors';
import type { ProductLot, RegisteredMovement, StockProduct } from '../types/inventory.types';
import { toQuantity } from '../types/movement.schema';
import {
  EMPTY_TRANSFER_LINE,
  transferSchema,
  type TransferFormValues,
} from '../types/transfer.schema';

/** API errors about the whole transfer, shown on their field instead of the banner. */
const HEADER_ERRORS = {
  WAREHOUSE_INVALID: 'originId',
  DESTINATION_WAREHOUSE_REQUIRED: 'destinationId',
  DESTINATION_WAREHOUSE_INVALID: 'destinationId',
  SAME_WAREHOUSE: 'destinationId',
  MOVEMENT_TYPE_INVALID: 'movementTypeId',
  MOVEMENT_TYPE_NOT_ALLOWED: 'movementTypeId',
} as const;

/** API errors about one line; their message starts with "Line N:". */
const LINE_ERRORS = {
  INSUFFICIENT_STOCK: 'quantity',
  LOT_REQUIRED: 'lotCode',
  LOT_NOT_ALLOWED: 'lotCode',
  LOT_NOT_FOUND: 'lotCode',
  PRODUCT_INVALID: 'productId',
} as const;

function fieldOf(error: unknown): FieldPath<TransferFormValues> | null {
  const code = getApiErrorCode(error);
  if (!code) return null;
  if (code in HEADER_ERRORS) return HEADER_ERRORS[code as keyof typeof HEADER_ERRORS];
  if (code in LINE_ERRORS) {
    const line = /^Line (\d+)/.exec(getApiErrorMessage(error, ''))?.[1];
    if (line) return `lines.${Number(line) - 1}.${LINE_ERRORS[code as keyof typeof LINE_ERRORS]}`;
  }
  return null;
}

/** What a line needs to show and check: its product, what can leave and its lots. */
export interface TransferLineInfo {
  product: StockProduct | null;
  /** What can leave the origin: the chosen lot's stock, or the warehouse's. Null until known. */
  available: number | null;
  /** Per-lot products: the lots with stock in the origin, and the chosen one. */
  lots: {
    items: ProductLot[];
    isLoading: boolean;
    loaded: boolean;
    chosen: ProductLot | null;
  } | null;
}

/**
 * State and rules of "Registrar traslado" (CU-16): one or more lines (a product once; a per-lot
 * product once per lot), the stock the origin has for each (a transfer takes it out like an
 * outbound movement), whether it may arrive at once (`movement.receive` in the destination) and
 * which API errors belong to a field.
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
      lines: [{ ...EMPTY_TRANSFER_LINE, productId: initialProductId ?? '' }],
      arrival: 'transit',
      documentRef: '',
      notes: '',
    },
  });
  const lines = useFieldArray({ control: form.control, name: 'lines' });

  const chosen = useWatch({ control: form.control, name: 'lines' }) ?? [];
  const originId = useWatch({ control: form.control, name: 'originId' });
  const destinationId = useWatch({ control: form.control, name: 'destinationId' });
  const arrival = useWatch({ control: form.control, name: 'arrival' });

  const productById = new Map(products.map((product) => [product.id, product]));
  const chosenProducts = [...new Set(chosen.map((line) => line.productId))].flatMap((id) => {
    const product = productById.get(id);
    return product ? [product] : [];
  });
  const stocks = useLinesStock(chosenProducts, originId || null);
  const stockOf = new Map(stocks.map((entry) => [entry.product.id, entry]));

  const lineInfo: TransferLineInfo[] = chosen.map((line) => {
    const product = productById.get(line.productId) ?? null;
    if (!product) return { product: null, available: null, lots: null };
    const entry = stockOf.get(product.id);
    const inOrigin =
      originId && entry?.stock
        ? (entry.stock.warehouses.find((row) => row.warehouse.id === originId)?.onHand ?? 0)
        : null;
    if (!product.tracksLots) return { product, available: inOrigin, lots: null };
    const items = entry?.lots.data ?? [];
    const lot = items.find((candidate) => candidate.code === line.lotCode) ?? null;
    return {
      product,
      available: lot ? lot.onHand : inOrigin,
      lots: {
        items,
        isLoading: entry?.lots.isLoading ?? false,
        loaded: entry?.lots.data !== undefined,
        chosen: lot,
      },
    };
  });

  /** Nobody else confirms what arrived, so arriving at once needs the right to receive there. */
  const canReceiveNow =
    Boolean(destinationId) && hasPermissionIn(user, 'movement.receive', destinationId);

  // A lot that is not in the origin (or not of the line's product) cannot stay chosen.
  const staleLots = lineInfo
    .flatMap((info, index) =>
      info.lots?.loaded &&
      chosen[index]?.lotCode &&
      !info.lots.items.some((lot) => lot.code === chosen[index].lotCode)
        ? [index]
        : [],
    )
    .join(',');
  useEffect(() => {
    if (!staleLots) return;
    for (const index of staleLots.split(',')) {
      form.setValue(`lines.${Number(index)}.lotCode`, '');
    }
  }, [staleLots, form]);

  // The destination cannot be the origin; nor can it arrive at once where the user cannot receive.
  useEffect(() => {
    if (originId && form.getValues('destinationId') === originId)
      form.setValue('destinationId', '');
  }, [originId, form]);
  useEffect(() => {
    if (arrival === 'now' && !canReceiveNow) form.setValue('arrival', 'transit');
  }, [arrival, canReceiveNow, form]);

  /** A line's product choices: not the ones other lines took, unless they are per lot. */
  const optionsFor = (index: number) => {
    const taken = new Set(
      chosen.flatMap((line, i) => (i !== index && line.productId ? [line.productId] : [])),
    );
    return products.filter((product) => product.tracksLots || !taken.has(product.id));
  };

  const submit = form.handleSubmit((values) => {
    let blocked = false;
    values.lines.forEach((line, index) => {
      const { product, available, lots } = lineInfo[index] ?? {};
      const quantity = toQuantity(line.quantity);
      if (product?.tracksLots && !line.lotCode.trim()) {
        form.setError(`lines.${index}.lotCode`, { message: 'Elige el lote que sale.' });
        blocked = true;
      } else if (product && available !== null && available !== undefined && quantity > available) {
        form.setError(`lines.${index}.quantity`, {
          message:
            available === 0
              ? 'No hay existencia de este producto en el origen.'
              : lots?.chosen
                ? `Solo hay ${formatQuantity(available, product.unit)} en el lote ${lots.chosen.code}.`
                : `Solo hay ${formatQuantity(available, product.unit)} en el origen.`,
        });
        blocked = true;
      }
    });
    if (blocked) return;
    register.mutate(
      {
        movementTypeId: values.movementTypeId,
        originId: values.originId,
        destinationId: values.destinationId,
        lines: values.lines.map((line) => ({
          productId: line.productId,
          quantity: toQuantity(line.quantity),
          lotCode: productById.get(line.productId)?.tracksLots ? line.lotCode : null,
        })),
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
    lines,
    lineInfo,
    optionsFor,
    submit,
    canReceiveNow,
    isSubmitting: register.isPending,
    serverError:
      register.isError && !fieldOf(register.error)
        ? inventoryErrorMessage(register.error, 'No se pudo registrar el traslado.')
        : null,
  };
}
