import {
  type QueryClient,
  queryOptions,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  ProductStock,
  RegisteredMovement,
  SetReplenishmentInput,
} from '../types/inventory.types';
import {
  getActiveProducts,
  getMovementTypes,
  getProductLots,
  getProductStock,
  getReplenishment,
  getWarehouseProductStock,
  getWarehouses,
  getWarehouseStock,
  registerAdjustment,
  registerMovement,
  setReplenishment,
} from './inventory.api';
import { inventoryKeys } from './inventory.keys';

export function useActiveProducts() {
  return useQuery({ queryKey: inventoryKeys.products(), queryFn: getActiveProducts });
}

/** A product's stock, also for `queryClient.fetchQuery` (the new stock after a movement). */
export const productStockQuery = (productId: string) =>
  queryOptions({
    queryKey: inventoryKeys.stock(productId),
    queryFn: () => getProductStock(productId),
  });

/** A product's stock. Null: nothing chosen yet. */
export function useProductStock(productId: string | null) {
  return useQuery({ ...productStockQuery(productId ?? ''), enabled: productId !== null });
}

/** Products enabled in `warehouseId`, with their stock there. Null: no warehouse chosen yet. */
export function useWarehouseStock(warehouseId: string | null) {
  return useQuery({
    queryKey: inventoryKeys.warehouseStock(warehouseId ?? ''),
    queryFn: () => getWarehouseStock(warehouseId ?? ''),
    enabled: warehouseId !== null,
  });
}

/** Lots of a per-lot product with stock in a warehouse. Null: not needed yet. */
export function useProductLots(productId: string | null, warehouseId: string | null) {
  return useQuery({
    queryKey: inventoryKeys.lots(productId ?? '', warehouseId ?? ''),
    queryFn: () => getProductLots(productId ?? '', warehouseId ?? ''),
    enabled: productId !== null && warehouseId !== null,
  });
}

export function useStockWarehouses() {
  return useQuery({ queryKey: inventoryKeys.warehouses(), queryFn: getWarehouses });
}

/** Types the user may register in `warehouseId`. Null: no warehouse chosen yet. */
export function useMovementTypes(warehouseId: string | null) {
  return useQuery({
    queryKey: inventoryKeys.movementTypes(warehouseId ?? ''),
    queryFn: () => getMovementTypes(warehouseId ?? ''),
    enabled: warehouseId !== null,
    staleTime: 300_000,
  });
}

/**
 * Both views of the stock changed: the product's and the warehouse's. Other screens (the product
 * detail) refetch on their own next time they open: their keys live in their feature. Not
 * awaited: the form closes as soon as the API confirms; the lists catch up behind it.
 */
function afterMovement(queryClient: QueryClient, movement: RegisteredMovement) {
  const { productId } = movement;
  const warehouseId = movement.warehouse.id;
  void Promise.all([
    queryClient.invalidateQueries({ queryKey: inventoryKeys.stock(productId) }),
    queryClient.invalidateQueries({ queryKey: inventoryKeys.warehouseStock(warehouseId) }),
    queryClient.invalidateQueries({ queryKey: inventoryKeys.stockIn(productId, warehouseId) }),
    queryClient.invalidateQueries({
      queryKey: inventoryKeys.replenishment(productId, warehouseId),
    }),
    queryClient.invalidateQueries({ queryKey: inventoryKeys.lots(productId, warehouseId) }),
    // The movement may have raised or resolved an alert (the alerts feature, and its bell).
    queryClient.invalidateQueries({ queryKey: inventoryKeys.alerts() }),
    queryClient.invalidateQueries({ queryKey: inventoryKeys.movements() }),
  ]);
}

export function useRegisterMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerMovement,
    onSuccess: (movement) => afterMovement(queryClient, movement),
  });
}

export function useRegisterAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerAdjustment,
    onSuccess: (movement) => afterMovement(queryClient, movement),
  });
}

/** A product's stock in one warehouse, also to read it fresh right before an adjustment. */
export const warehouseProductStockQuery = (productId: string, warehouseId: string) =>
  queryOptions({
    queryKey: inventoryKeys.stockIn(productId, warehouseId),
    queryFn: () => getWarehouseProductStock(productId, warehouseId),
  });

/**
 * Null: not both chosen yet. Read again every time the form opens: a count is compared with it,
 * so a cached figure is not good enough.
 */
export function useWarehouseProductStock(productId: string | null, warehouseId: string | null) {
  return useQuery({
    ...warehouseProductStockQuery(productId ?? '', warehouseId ?? ''),
    enabled: productId !== null && warehouseId !== null,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

/** A product's replenishment values in a warehouse, with available stock and the open alert. */
export function useReplenishment(productId: string, warehouseId: string) {
  return useQuery({
    queryKey: inventoryKeys.replenishment(productId, warehouseId),
    queryFn: () => getReplenishment(productId, warehouseId),
  });
}

export function useSetReplenishment(productId: string, warehouseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SetReplenishmentInput) => setReplenishment(productId, warehouseId, input),
    onSuccess: (saved) => {
      queryClient.setQueryData(inventoryKeys.replenishment(productId, warehouseId), saved);
      // The rows show the saved values at once, alert and values together; the refetch confirms.
      const values = {
        safetyStock: saved.safetyStock,
        reorderPoint: saved.reorderPoint,
        source: saved.source,
      };
      queryClient.setQueryData<ProductStock>(
        inventoryKeys.stock(productId),
        (old) =>
          old && {
            ...old,
            warehouses: old.warehouses.map((row) =>
              row.warehouse.id === warehouseId ? { ...row, ...values } : row,
            ),
          },
      );
      // The product view shows the values and their origin. Not awaited, like movements.
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.stock(productId) });
      // New values re-evaluate the alert (US-016: the next alerts use them).
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.alerts() });
    },
  });
}

/** The replenishment values (with the open alert) of a product in several warehouses. */
export function useReplenishments(productId: string, warehouseIds: string[]) {
  return useQueries({
    queries: warehouseIds.map((warehouseId) => ({
      queryKey: inventoryKeys.replenishment(productId, warehouseId),
      queryFn: () => getReplenishment(productId, warehouseId),
    })),
  });
}
