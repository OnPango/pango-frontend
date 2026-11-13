import { http } from '@/core/api/http';
import type {
  AlertFilters,
  AlertPage,
  AlertProduct,
  CurrentStock,
  Option,
  StockAlert,
} from '../types/alerts.types';
import type {
  AlertDto,
  AlertPageDto,
  ProductPageDto,
  ReplenishmentDto,
  WarehouseDto,
} from './alerts.dto';
import { toCurrentStock, toListQuery, toStockAlert } from './alerts.mappers';

/**
 * `GET /alerts`, most recent first (US-044): only the organization's, and of those only the
 * warehouses where the user holds `alert.read`.
 */
export async function getAlerts(filters: AlertFilters): Promise<AlertPage> {
  const { data } = await http.get<AlertPageDto>('/alerts', { params: toListQuery(filters) });
  return { items: data.items.map(toStockAlert), total: data.total };
}

/** `GET /alerts/:id`; `404 ALERT_NOT_FOUND` when it does not exist or the user cannot read it. */
export async function getAlert(id: string): Promise<StockAlert> {
  const { data } = await http.get<AlertDto>(`/alerts/${id}`);
  return toStockAlert(data);
}

/** The product's stock and replenishment values now, in the alert's warehouse (`stock.read`). */
export async function getCurrentStock(
  productId: string,
  warehouseId: string,
): Promise<CurrentStock> {
  const { data } = await http.get<ReplenishmentDto>(
    `/products/${productId}/warehouses/${warehouseId}/replenishment`,
  );
  return toCurrentStock(data);
}

/** `GET /warehouses`: every one the user can see, closed ones too (their alerts stay). */
export async function getAlertWarehouses(): Promise<(Option & { isActive: boolean })[]> {
  const { data } = await http.get<WarehouseDto[]>('/warehouses', { params: { status: 'ALL' } });
  return data
    .map((w) => ({ id: String(w.id), name: w.name, isActive: w.isActive }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

const MAX_PAGE_SIZE = 100;

/** Every product, archived ones too: an archived product keeps its old alerts. */
export async function getAlertProducts(): Promise<AlertProduct[]> {
  const page = async (n: number) =>
    (
      await http.get<ProductPageDto>('/products', {
        params: { status: 'ALL', page: n, pageSize: MAX_PAGE_SIZE },
      })
    ).data;
  const first = await page(1);
  const pages = Math.ceil(first.total / MAX_PAGE_SIZE);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) => page(index + 2)),
  );
  return [first, ...rest]
    .flatMap((p) => p.items)
    .map((dto) => ({ id: String(dto.id), sku: dto.sku, name: dto.name }));
}
