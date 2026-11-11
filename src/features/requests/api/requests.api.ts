import { http } from '@/core/api/http';
import type {
  CreateRequestInput,
  Option,
  RequestableProduct,
  RequestFilters,
  RequestPage,
  StockRequest,
} from '../types/requests.types';
import type {
  DepartmentDto,
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
  const { data } = await http.get<StockRequestPageDto>('/stock-requests', {
    params: toListQuery(filters),
  });
  return { items: data.items.map(toStockRequest), total: data.total };
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

/** Active products, to request them by code or name. */
export async function getRequestableProducts(): Promise<RequestableProduct[]> {
  const page = async (n: number) =>
    (
      await http.get<ProductPageDto>('/products', {
        params: { status: 'ACTIVE', page: n, pageSize: MAX_PAGE_SIZE },
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
