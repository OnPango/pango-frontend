import {
  queryOptions,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type { SetReplenishmentInput, WarehouseStockRow } from '../types/inventory.types';
import {
  getActiveProducts,
  getAllProducts,
  getMovementTypes,
  getProductStock,
  getReplenishment,
  getWarehouses,
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

/** How many product details are asked for at the same time while building a warehouse's stock. */
const PARALLEL_REQUESTS = 6;
/** A product's stock read for the warehouse list stays fresh this long (a movement invalidates it). */
const DETAIL_FRESH_MS = 60_000;

async function mapInBatches<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>) {
  const results: R[] = [];
  for (let start = 0; start < items.length; start += size) {
    results.push(...(await Promise.all(items.slice(start, start + size).map(fn))));
  }
  return results;
}

/**
 * The products with stock in a warehouse.
 *
 * TEMPORARY: pango-core has no endpoint for a whole warehouse's stock yet (requested:
 * `GET /stock?warehouseId=`), so this reads every product's detail (`GET /products/:id`, cached and
 * shared with the product view) and keeps those enabled in the warehouse. Fine for tens of
 * products; when the endpoint exists, only this function changes.
 */
async function loadWarehouseStock(
  queryClient: QueryClient,
  warehouseId: string,
): Promise<WarehouseStockRow[]> {
  const products = await queryClient.query({
    queryKey: inventoryKeys.allProducts(),
    queryFn: getAllProducts,
    staleTime: DETAIL_FRESH_MS,
  });
  const stocks = await mapInBatches(products, PARALLEL_REQUESTS, (product) =>
    queryClient.query({ ...productStockQuery(product.id), staleTime: DETAIL_FRESH_MS }),
  );
  return stocks.flatMap((stock) => {
    const row = stock.warehouses.find((entry) => entry.warehouse.id === warehouseId);
    return row
      ? [
          {
            product: stock.product,
            onHand: row.onHand,
            reorderPoint: row.reorderPoint,
            source: row.source,
          },
        ]
      : [];
  });
}

/** Products enabled in `warehouseId`, with their stock there. Null: no warehouse chosen yet. */
export function useWarehouseStock(warehouseId: string | null) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: inventoryKeys.warehouseStock(warehouseId ?? ''),
    queryFn: () => loadWarehouseStock(queryClient, warehouseId ?? ''),
    enabled: warehouseId !== null,
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

export function useRegisterMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerMovement,
    // Both views of the stock changed: the product's and the warehouse's. Other screens (the
    // product detail) refetch on their own next time they open: their keys live in their feature.
    onSuccess: (movement) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: inventoryKeys.stock(movement.productId) }),
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.warehouseStock(movement.warehouse.id),
        }),
        queryClient.invalidateQueries({
          queryKey: inventoryKeys.replenishment(movement.productId, movement.warehouse.id),
        }),
      ]),
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
      // The rows show the values and their origin.
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: inventoryKeys.stock(productId) }),
        queryClient.invalidateQueries({ queryKey: inventoryKeys.warehouseStock(warehouseId) }),
      ]);
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
