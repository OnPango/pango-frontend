import { http } from '@/core/api/http';
import type {
  DemandSeries,
  Forecast,
  ForecastRun,
  ForecastRunPage,
  Option,
  StartRunInput,
  WarehouseForecastFilters,
  WarehouseForecastPage,
} from '../types/forecast.types';
import type {
  DemandSeriesDto,
  ForecastPageDto,
  ForecastRunDto,
  ForecastRunPageDto,
  ProductPageDto,
  WarehouseDto,
  WarehouseForecastPageDto,
} from './forecast.dto';
import {
  toDemandSeries,
  toForecast,
  toForecastRun,
  toStartRunDto,
  toWarehouseForecastPage,
  toWarehouseForecastQuery,
} from './forecast.mappers';

/**
 * `GET /products/:id/demand`, weekly like the forecast, from `from` (`YYYY-MM-DD`) to today.
 * `404 WAREHOUSE_NOT_FOUND` without `forecast.read` in the warehouse.
 */
export async function getDemand(
  productId: string,
  warehouseId: string,
  from: string,
): Promise<DemandSeries> {
  const { data } = await http.get<DemandSeriesDto>(`/products/${productId}/demand`, {
    params: { warehouseId, granularity: 'WEEKLY', from },
  });
  return toDemandSeries(data);
}

/** How many past results of a product to read: enough to find the current one behind errors. */
const RECENT_FORECASTS = 10;

/** `GET /products/:id/forecasts` in one warehouse, newest first. */
export async function getProductForecasts(
  productId: string,
  warehouseId: string,
): Promise<Forecast[]> {
  const { data } = await http.get<ForecastPageDto>(`/products/${productId}/forecasts`, {
    params: { warehouseId, page: 1, pageSize: RECENT_FORECASTS },
  });
  return data.items.map(toForecast);
}

/**
 * `GET /warehouses/:id/forecasts`: where the forecast of every product of a warehouse stands.
 * Proposed to pango-core and not implemented there yet; only the mock answers it for now. Not
 * called until then: the view that uses it is commented out in `ForecastPage`.
 */
export async function getWarehouseForecasts(
  filters: WarehouseForecastFilters,
): Promise<WarehouseForecastPage> {
  const { data } = await http.get<WarehouseForecastPageDto>(
    `/warehouses/${filters.warehouseId}/forecasts`,
    { params: toWarehouseForecastQuery(filters) },
  );
  return toWarehouseForecastPage(data);
}

/** `GET /forecast-runs`, most recent first. */
export async function getForecastRuns(page: number, pageSize: number): Promise<ForecastRunPage> {
  const { data } = await http.get<ForecastRunPageDto>('/forecast-runs', {
    params: { page, pageSize },
  });
  return { items: data.items.map(toForecastRun), total: data.total };
}

/**
 * `POST /forecast-runs`: answers `202` with the run `RUNNING`; the rest happens in the background.
 * Rejects with `FORECAST_SERVICE_NOT_CONFIGURED`, `FORECAST_RUN_IN_PROGRESS` or
 * `NOTHING_TO_FORECAST`.
 */
export async function startForecastRun(input: StartRunInput): Promise<ForecastRun> {
  const { data } = await http.post<ForecastRunDto>('/forecast-runs', toStartRunDto(input));
  return toForecastRun(data);
}

/** `GET /warehouses`: the active ones the user can see, by name. */
export async function getForecastWarehouses(): Promise<Option[]> {
  const { data } = await http.get<WarehouseDto[]>('/warehouses');
  return data
    .map((w) => ({ id: String(w.id), name: w.name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

const MAX_PAGE_SIZE = 100;

/** Every active product, for the product selector. */
export async function getForecastProducts(): Promise<(Option & { sku: string })[]> {
  const page = async (n: number) =>
    (await http.get<ProductPageDto>('/products', { params: { page: n, pageSize: MAX_PAGE_SIZE } }))
      .data;
  const first = await page(1);
  const pages = Math.ceil(first.total / MAX_PAGE_SIZE);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, index) => page(index + 2)),
  );
  return [first, ...rest]
    .flatMap((p) => p.items)
    .map((dto) => ({ id: String(dto.id), sku: dto.sku, name: dto.name }));
}
