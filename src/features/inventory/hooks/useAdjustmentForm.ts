import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { getApiErrorCode } from '@/core/api/errors';
import { formatQuantity } from '@/shared/lib/units';
import {
  useRegisterAdjustment,
  useWarehouseProductStock,
  warehouseProductStockQuery,
} from '../api/inventory.queries';
import { inventoryErrorMessage } from '../content/inventory.errors';
import { adjustmentSchema, NEW_LOT, type AdjustmentFormValues } from '../types/adjustment.schema';
import type {
  RegisteredMovement,
  StockProduct,
  WarehouseProductStock,
} from '../types/inventory.types';
import { toQuantity } from '../types/movement.schema';

/** API errors shown on their field instead of the banner. */
const FIELD_ERRORS = {
  INSUFFICIENT_STOCK: 'counted',
  LOT_REQUIRED: 'lot',
  LOT_NOT_ALLOWED: 'lot',
  LOT_NOT_FOUND: 'lot',
  PRODUCT_INVALID: 'productId',
  WAREHOUSE_INVALID: 'warehouseId',
  MOVEMENT_TYPE_INVALID: 'movementTypeId',
  MOVEMENT_TYPE_NOT_ALLOWED: 'movementTypeId',
} as const satisfies Record<string, keyof AdjustmentFormValues>;

const fieldOf = (error: unknown) => {
  const code = getApiErrorCode(error);
  return code && code in FIELD_ERRORS ? FIELD_ERRORS[code as keyof typeof FIELD_ERRORS] : null;
};

const round = (value: number) => Number(value.toFixed(4));

/** Balances of one lot (or, with null, of the stock without lot) in the warehouse. */
const balancesOf = (stock: WarehouseProductStock, lotCode: string | null) =>
  stock.balances.filter((balance) => (balance.lot?.code ?? null) === lotCode);

const onHandOf = (stock: WarehouseProductStock, lotCode: string | null) =>
  round(balancesOf(stock, lotCode).reduce((sum, balance) => sum + balance.onHand, 0));

export interface AdjustmentLot {
  code: string;
  expiryDate: string | null;
  onHand: number;
}

/** The lots with stock in the warehouse, earliest expiry first (those without a date last). */
function lotsOf(stock: WarehouseProductStock): AdjustmentLot[] {
  const byCode = new Map<string, AdjustmentLot>();
  for (const { lot, onHand } of stock.balances) {
    if (!lot) continue;
    const current = byCode.get(lot.code);
    byCode.set(lot.code, {
      code: lot.code,
      expiryDate: lot.expiryDate,
      onHand: round((current?.onHand ?? 0) + onHand),
    });
  }
  return [...byCode.values()].sort(
    (a, b) =>
      (a.expiryDate ?? '9999').localeCompare(b.expiryDate ?? '9999') ||
      a.code.localeCompare(b.code),
  );
}

/**
 * State and rules of "Registrar ajuste": the user writes what they counted and the form works out
 * the difference with the stock (which way and how much), so nobody does the subtraction by hand.
 * Right before saving it reads the stock again: if it changed meanwhile, the count is checked
 * against the new figure instead of registering a stale difference.
 */
export function useAdjustmentForm({
  products,
  initialProductId,
  initialWarehouseId,
  onSaved,
}: {
  products: StockProduct[];
  initialProductId: string | null;
  initialWarehouseId: string | null;
  onSaved: (movement: RegisteredMovement) => void;
}) {
  const queryClient = useQueryClient();
  const register = useRegisterAdjustment();
  const [checking, setChecking] = useState(false);

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    mode: 'onTouched',
    defaultValues: {
      warehouseId: initialWarehouseId ?? '',
      movementTypeId: '',
      productId: initialProductId ?? '',
      lot: '',
      newLot: '',
      counted: '',
      notes: '',
      documentRef: '',
    },
  });

  const [productId, warehouseId, lot, newLot, countedText] = useWatch({
    control: form.control,
    name: ['productId', 'warehouseId', 'lot', 'newLot', 'counted'],
  });
  const product = products.find((candidate) => candidate.id === productId) ?? null;
  const stockQuery = useWarehouseProductStock(productId || null, warehouseId || null);
  const stock =
    stockQuery.data?.productId === productId && stockQuery.data.warehouseId === warehouseId
      ? stockQuery.data
      : null;

  const lots = useMemo(() => (stock && product?.tracksLots ? lotsOf(stock) : []), [stock, product]);
  /** The lot being counted: none for products without lots, null until one is chosen. */
  const lotCode = !product?.tracksLots
    ? null
    : lot === NEW_LOT
      ? newLot.trim() || undefined
      : lot || undefined;

  /**
   * What Pango has of the product (or lot) in the warehouse; null until it is known. Not shown
   * while it is being read again: a count compared with an old figure would be wrong.
   */
  const refreshing = stockQuery.isFetching;
  const recorded = stock && !refreshing && lotCode !== undefined ? onHandOf(stock, lotCode) : null;
  const counted = adjustmentSchema.shape.counted.safeParse(countedText).success
    ? toQuantity(countedText)
    : null;
  const difference = recorded !== null && counted !== null ? round(counted - recorded) : null;

  /** After a decrease, less would be left in the warehouse than requests in attention hold. */
  const shortfall =
    stock && difference !== null && difference < 0 && stock.onHand + difference < stock.reserved
      ? { left: round(stock.onHand + difference), reserved: stock.reserved }
      : null;

  const submit = form.handleSubmit(async (values) => {
    if (!product) return;
    if (product.tracksLots && !values.lot) {
      form.setError('lot', {
        message: 'Este producto se sigue por lote: elige el lote que contaste.',
      });
      return;
    }
    if (product.tracksLots && values.lot === NEW_LOT && !values.newLot) {
      form.setError('newLot', { message: 'Escribe el código del lote.' });
      return;
    }
    if (recorded === null) {
      form.setError('counted', {
        message: 'Espera a que cargue la existencia registrada para compararla con tu conteo.',
      });
      return;
    }
    const code = !product.tracksLots ? null : values.lot === NEW_LOT ? values.newLot : values.lot;
    const count = toQuantity(values.counted);

    // The stock may have moved since the form opened: compare the count with the latest figure.
    setChecking(true);
    let fresh: WarehouseProductStock;
    try {
      fresh = await queryClient.fetchQuery({
        ...warehouseProductStockQuery(values.productId, values.warehouseId),
        staleTime: 0,
      });
    } catch (error) {
      setChecking(false);
      form.setError('root', {
        message: inventoryErrorMessage(error, 'No se pudo leer la existencia actual.'),
      });
      return;
    }
    setChecking(false);
    const now = onHandOf(fresh, code);
    const unit = (value: number) => formatQuantity(value, product.unit);
    if (now !== recorded) {
      form.setError(
        'counted',
        {
          message: `La existencia cambió mientras registrabas: ahora hay ${unit(now)}. Revisa el conteo y confirma de nuevo.`,
        },
        { shouldFocus: true },
      );
      return;
    }
    const delta = round(count - now);
    if (delta === 0) {
      form.setError(
        'counted',
        { message: 'Coincide con lo registrado: no hay nada que ajustar.' },
        { shouldFocus: true },
      );
      return;
    }

    // A line removes from one location: a decrease takes from each one that holds the lot.
    const lines: { quantity: number; locationId: string | null }[] = [];
    if (delta > 0) {
      lines.push({ quantity: delta, locationId: null });
    } else {
      let left = -delta;
      for (const balance of balancesOf(fresh, code)) {
        if (left <= 0) break;
        if (balance.onHand <= 0) continue;
        const take = round(Math.min(left, balance.onHand));
        lines.push({ quantity: take, locationId: balance.locationId });
        left = round(left - take);
      }
    }

    register.mutate(
      {
        movementTypeId: values.movementTypeId,
        warehouseId: values.warehouseId,
        productId: values.productId,
        lotCode: code,
        direction: delta > 0 ? 'increase' : 'decrease',
        lines,
        notes: values.notes,
        documentRef: values.documentRef || null,
      },
      {
        onSuccess: onSaved,
        onError: (error) => {
          const field = fieldOf(error);
          if (field) {
            const message = inventoryErrorMessage(error, 'No se pudo registrar el ajuste.');
            form.setError(
              field === 'lot' && values.lot === NEW_LOT ? 'newLot' : field,
              { message },
              { shouldFocus: true },
            );
          }
        },
      },
    );
  });

  const rootError = form.formState.errors.root?.message ?? null;

  return {
    form,
    submit,
    product,
    /** For products that track lots: the ones with stock in the chosen warehouse. */
    lots,
    lotsLoading: stockQuery.isLoading,
    /** The stock is being read (on opening, or again before saving). */
    refreshing,
    stockError: stockQuery.error
      ? inventoryErrorMessage(stockQuery.error, 'No se pudo cargar la existencia del almacén.')
      : null,
    /** The lot being counted (`undefined`: not chosen yet). */
    lotCode,
    recorded,
    difference,
    shortfall,
    isSubmitting: checking || register.isPending,
    /** Errors that are not about one field (permissions, network…). */
    serverError:
      rootError ??
      (register.isError && !fieldOf(register.error)
        ? inventoryErrorMessage(register.error, 'No se pudo registrar el ajuste.')
        : null),
  };
}
