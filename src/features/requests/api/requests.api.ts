import { http } from '@/core/api/http';
import {
  ACTIVE_STATUSES,
  type CreateRequestInput,
  type FulfilInput,
  type RequestLot,
  type Option,
  type RequestableProduct,
  type RequestFilters,
  type RequestPage,
  type RequestStatus,
  type StockRequest,
} from '../types/requests.types';
import type {
  DepartmentDto,
  LotDto,
  ProductPageDto,
  StockRequestDto,
  StockRequestPageDto,
  UserDto,
  WarehouseDto,
} from './requests.dto';
import { toCreateRequestDto, toListQuery, toStockRequest } from './requests.mappers';

/**
 * `GET /stock-requests`, most recent first. A user sees the requests of the warehouses where they
 * hold `stock_request.read` and every request of their own area.
 */
export async function getRequests(filters: RequestFilters): Promise<RequestPage> {
  if (filters.status === 'active') return getActiveRequests(filters);
  const { data } = await http.get<StockRequestPageDto>('/stock-requests', {
    params: toListQuery({ ...filters, status: filters.status }),
  });
  return { items: data.items.map(toStockRequest), total: data.total };
}

/** Every request with one status that matches the other filters, 100 per request. */
async function getAllWithStatus(
  filters: RequestFilters,
  status: RequestStatus,
): Promise<StockRequest[]> {
  const page = async (n: number) =>
    (
      await http.get<StockRequestPageDto>('/stock-requests', {
        params: toListQuery({ ...filters, status, page: n, pageSize: MAX_PAGE_SIZE }),
      })
    ).data;
  const first = await page(1);
  const pages = Math.ceil(first.total / MAX_PAGE_SIZE);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) => page(index + 2)),
  );
  return [first, ...rest].flatMap((p) => p.items).map(toStockRequest);
}

/**
 * Pending and in attention together. The API filters by one status at a time, so this reads both
 * and pages them here, in the API's order. Active requests are few (they get attended); the
 * history, which grows without end, is always paged by the API.
 */
async function getActiveRequests(filters: RequestFilters): Promise<RequestPage> {
  const lists = await Promise.all(
    ACTIVE_STATUSES.map((status) => getAllWithStatus(filters, status)),
  );
  const all = lists
    .flat()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || Number(b.id) - Number(a.id));
  const start = (filters.page - 1) * filters.pageSize;
  return { items: all.slice(start, start + filters.pageSize), total: all.length };
}

/** A request waits up to this long: like movements, a timeout must not hide one that was saved. */
const WRITE_TIMEOUT_MS = 60_000;

/** `POST /stock-requests`: it starts pending and does not change stock. */
export async function createRequest(input: CreateRequestInput): Promise<StockRequest> {
  const { data } = await http.post<StockRequestDto>('/stock-requests', toCreateRequestDto(input), {
    timeout: WRITE_TIMEOUT_MS,
  });
  return toStockRequest(data);
}

/** `POST /stock-requests/:id/cancel`: only its requester, only while pending. */
export async function cancelRequest(id: string): Promise<StockRequest> {
  const { data } = await http.post<StockRequestDto>(`/stock-requests/${id}/cancel`, undefined, {
    timeout: WRITE_TIMEOUT_MS,
  });
  return toStockRequest(data);
}

const MAX_PAGE_SIZE = 100;

/**
 * Active products, to request them by code or name; with `ALL`, archived ones too (the history
 * filter: a finished request may name a product retired since).
 */
export async function getRequestableProducts(
  status: 'ACTIVE' | 'ALL' = 'ACTIVE',
): Promise<RequestableProduct[]> {
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
  return [first, ...rest]
    .flatMap((p) => p.items)
    .map((dto) => ({
      id: String(dto.id),
      sku: dto.sku,
      name: dto.name,
      unit: { code: dto.stockUnit.code, name: dto.stockUnit.name },
      tracksLots: dto.tracksLots,
    }));
}

/** `GET /warehouses`: the open ones the user can see. */
export async function getOpenWarehouses(): Promise<Option[]> {
  const { data } = await http.get<WarehouseDto[]>('/warehouses');
  return data.filter((w) => w.isActive).map((w) => ({ id: String(w.id), name: w.name }));
}

/** `GET /departments?status=ALL`: every area, for the list filter. */
export async function getDepartments(): Promise<(Option & { isActive: boolean })[]> {
  const { data } = await http.get<DepartmentDto[]>('/departments', { params: { status: 'ALL' } });
  return data.map((d) => ({ id: String(d.id), name: d.name, isActive: d.isActive }));
}

/** The signed-in user's area, read from `GET /users/:id` (needs `user.read`). */
export async function getUserDepartment(userId: string): Promise<Option | null> {
  const { data } = await http.get<UserDto>(`/users/${userId}`);
  return data.department ? { id: String(data.department.id), name: data.department.name } : null;
}

// ---- Attention (US-030, US-031): `stock_request.approve` in the warehouse ----

/** `GET /stock-requests/:id`: lines, status history and the fulfilling movement. */
export async function getRequest(id: string): Promise<StockRequest> {
  const { data } = await http.get<StockRequestDto>(`/stock-requests/${id}`);
  return toStockRequest(data);
}

/** Pending → in attention: reserves the full quantity of every line (`409 INSUFFICIENT_STOCK`). */
export async function startRequest(id: string): Promise<StockRequest> {
  const { data } = await http.post<StockRequestDto>(`/stock-requests/${id}/start`, undefined, {
    timeout: WRITE_TIMEOUT_MS,
  });
  return toStockRequest(data);
}

/**
 * In attention → fulfilled: registers the outbound movement ("Consumption issue", source stock
 * request) in the same operation. Per-lot lines say their lot; the rest use the default location.
 */
export async function fulfilRequest(id: string, input: FulfilInput): Promise<StockRequest> {
  const { data } = await http.post<StockRequestDto>(
    `/stock-requests/${id}/fulfil`,
    { lines: input.lines },
    { timeout: WRITE_TIMEOUT_MS },
  );
  return toStockRequest(data);
}

/** Pending or in attention → rejected, with a reason (releases the reservation). */
export async function rejectRequest(id: string, reason: string): Promise<StockRequest> {
  const { data } = await http.post<StockRequestDto>(
    `/stock-requests/${id}/reject`,
    { reason: reason.trim() },
    { timeout: WRITE_TIMEOUT_MS },
  );
  return toStockRequest(data);
}

/** `GET /products/:id/lots?warehouseId=`: lots with stock there, earliest expiry first. */
export async function getLots(productId: string, warehouseId: string): Promise<RequestLot[]> {
  const { data } = await http.get<LotDto[]>(`/products/${productId}/lots`, {
    params: { warehouseId: Number(warehouseId) },
  });
  return data.map((lot) => ({ code: lot.code, expiryDate: lot.expiryDate, onHand: lot.onHand }));
}
