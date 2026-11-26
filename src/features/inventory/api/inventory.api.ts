import { http } from '@/core/api/http';
import type {
  CurrentForecastSummary,
  MovementType,
  ProductLot,
  ProductStock,
  RegisterAdjustmentInput,
  RegisteredMovement,
  RegisterMovementInput,
  RegisterTransferInput,
  Replenishment,
  SetReplenishmentInput,
  StockProduct,
  UpdateLotDatesInput,
  WarehouseOption,
  WarehouseProductStock,
  WarehouseStockRow,
} from '../types/inventory.types';
import type {
  ForecastPreviewPageDto,
  LotDto,
  MovementCountDto,
  MovementDto,
  MovementTypeDto,
  ProductDetailDto,
  ProductPageDto,
  ReplenishmentDto,
  StockPageDto,
  WarehouseDto,
  WarehouseProductStockDto,
} from './inventory.dto';
import {
  toCreateAdjustmentDto,
  toCreateMovementDto,
  toCreateTransferDto,
  toCurrentForecast,
  toMovementType,
  toProductStock,
  toRegisteredMovement,
  toReplenishment,
  toSetReplenishmentDto,
  toStockProduct,
  toWarehouseOption,
  toWarehouseProductStock,
} from './inventory.mappers';

/** The most `GET /products` gives per page. */
const MAX_PAGE_SIZE = 100;

/** Every product with the given status; the first page says how many follow, asked for together. */
async function getCatalog(status: 'ACTIVE' | 'ALL'): Promise<StockProduct[]> {
  const page = async (n: number) =>
    (
      await http.get<ProductPageDto>('/products', {
        params: { status, page: n, pageSize: MAX_PAGE_SIZE },
      })
    ).data;
  const first = await page(1);
  const pages = Math.ceil(first.total / MAX_PAGE_SIZE);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) => page(index + 2)),
  );
  return [first, ...rest].flatMap((p) => p.items).map(toStockProduct);
}

/** Active products, to pick one by code or name (CU-05, step 2). */
export const getActiveProducts = () => getCatalog('ACTIVE');

/** `GET /products/:id`: the total and the stock per warehouse (US-015). */
export async function getProductStock(id: string): Promise<ProductStock> {
  const { data } = await http.get<ProductDetailDto>(`/products/${id}`);
  return toProductStock(data);
}

/** `GET /warehouses`: the open warehouses the user can see. */
export async function getWarehouses(): Promise<WarehouseOption[]> {
  const { data } = await http.get<WarehouseDto[]>('/warehouses');
  return data.filter((warehouse) => warehouse.isActive).map(toWarehouseOption);
}

/** `GET /movement-types?warehouseId=`: only the types the user's roles allow there. */
export async function getMovementTypes(warehouseId: string): Promise<MovementType[]> {
  const { data } = await http.get<MovementTypeDto[]>('/movement-types', {
    params: { warehouseId: Number(warehouseId) },
  });
  return data.map(toMovementType);
}

/**
 * A movement locks the product's rows and re-evaluates alerts in one transaction: it can take a
 * while. A timeout that fires while the API is still working would report an error for a movement
 * that does get registered, and a retry would register it twice, so it waits longer than reads.
 */
const MOVEMENT_TIMEOUT_MS = 60_000;

/** `POST /movements`: confirmed at once; the stock changes in the same operation. */
export async function registerMovement(input: RegisterMovementInput): Promise<RegisteredMovement> {
  const { data } = await http.post<MovementDto>('/movements', toCreateMovementDto(input), {
    timeout: MOVEMENT_TIMEOUT_MS,
  });
  return toRegisteredMovement(data);
}

/** `POST /movements` with an adjustment type: the lines carry its direction. */
export async function registerAdjustment(
  input: RegisterAdjustmentInput,
): Promise<RegisteredMovement> {
  const { data } = await http.post<MovementDto>('/movements', toCreateAdjustmentDto(input), {
    timeout: MOVEMENT_TIMEOUT_MS,
  });
  return toRegisteredMovement(data);
}

/**
 * `POST /movements` with a transfer type (CU-16): the stock leaves the origin now, and arrives at
 * the destination at once or when the destination receives it.
 */
export async function registerTransfer(input: RegisterTransferInput): Promise<RegisteredMovement> {
  const { data } = await http.post<MovementDto>('/movements', toCreateTransferDto(input), {
    timeout: MOVEMENT_TIMEOUT_MS,
  });
  return toRegisteredMovement(data);
}

/** How many transfers are on their way to the warehouse (`IN_TRANSIT`, not received yet). */
export async function countIncomingTransfers(warehouseId: string): Promise<number> {
  const { data } = await http.get<MovementCountDto>('/movements', {
    params: { status: 'IN_TRANSIT', destinationWarehouseId: Number(warehouseId), pageSize: 1 },
  });
  return data.total;
}

/** `GET /products/:id/stock?warehouseId=`: totals and the balances by location and lot. */
export async function getWarehouseProductStock(
  productId: string,
  warehouseId: string,
): Promise<WarehouseProductStock> {
  const { data } = await http.get<WarehouseProductStockDto>(`/products/${productId}/stock`, {
    params: { warehouseId: Number(warehouseId) },
  });
  return toWarehouseProductStock(data);
}

const replenishmentPath = (productId: string, warehouseId: string) =>
  `/products/${productId}/warehouses/${warehouseId}/replenishment`;

/** US-016: the values, the stock they compare to and the open alert. Defaults if never set. */
export async function getReplenishment(
  productId: string,
  warehouseId: string,
): Promise<Replenishment> {
  const { data } = await http.get<ReplenishmentDto>(replenishmentPath(productId, warehouseId));
  return toReplenishment(data);
}

/**
 * Saves manual fallback values, the replenishment method (`FIXED_ROP` vs `FORECAST_ROP`) and
 * lead time, recalculating system values when appropriate and re-evaluating the alert. Min and max
 * stock stay part of the body so omitting them never clears them.
 */
export async function setReplenishment(
  productId: string,
  warehouseId: string,
  input: SetReplenishmentInput,
): Promise<Replenishment> {
  const { data } = await http.put<ReplenishmentDto>(
    replenishmentPath(productId, warehouseId),
    toSetReplenishmentDto(input),
  );
  return toReplenishment(data);
}

/**
 * Current OK forecast for live preview in replenishment editing; null if none exists yet.
 */
export async function getCurrentForecast(
  productId: string,
  warehouseId: string,
): Promise<CurrentForecastSummary | null> {
  const { data } = await http.get<ForecastPreviewPageDto>(`/products/${productId}/forecasts`, {
    params: { warehouseId: Number(warehouseId), page: 1, pageSize: 25 },
  });
  return toCurrentForecast(data);
}

/**
 * `GET /stock?warehouseId=&includeZero=true`: every product enabled in the warehouse, zeros
 * included (the page hides them unless asked), 100 per request. The page searches (by family
 * too) and paginates in the browser.
 */
export async function getWarehouseStock(warehouseId: string): Promise<WarehouseStockRow[]> {
  const page = async (n: number) =>
    (
      await http.get<StockPageDto>('/stock', {
        params: {
          warehouseId: Number(warehouseId),
          includeZero: true,
          page: n,
          pageSize: MAX_PAGE_SIZE,
        },
      })
    ).data;
  const first = await page(1);
  const pages = Math.ceil(first.total / MAX_PAGE_SIZE);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) => page(index + 2)),
  );
  return [first, ...rest]
    .flatMap((p) => p.items)
    .map((item) => ({
      product: toStockProduct(item.product),
      onHand: item.onHand,
      reserved: item.reserved,
      available: item.available,
    }));
}

/** `GET /products/:id/lots?warehouseId=`: lots with stock there, earliest expiry first. */
export async function getProductLots(
  productId: string,
  warehouseId: string,
): Promise<ProductLot[]> {
  const { data } = await http.get<LotDto[]>(`/products/${productId}/lots`, {
    params: { warehouseId: Number(warehouseId) },
  });
  return data.map((lot) => ({
    id: String(lot.id),
    code: lot.code,
    manufactureDate: lot.manufactureDate,
    expiryDate: lot.expiryDate,
    onHand: lot.onHand,
  }));
}

/** `PATCH /products/:id/lots/:lotId`: the lot's manufacture and expiry dates (`product.manage`). */
export async function updateLotDates(input: UpdateLotDatesInput): Promise<void> {
  await http.patch(`/products/${input.productId}/lots/${input.lotId}`, {
    manufactureDate: input.manufactureDate,
    expiryDate: input.expiryDate,
  });
}
