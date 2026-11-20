import type {
  DemandSeries,
  Forecast,
  ForecastRun,
  RunStatus,
  StartRunInput,
  WarehouseForecastFilters,
  WarehouseForecastPage,
} from '../types/forecast.types';
import type {
  DemandSeriesDto,
  ForecastDto,
  ForecastRunDto,
  StartForecastRunDto,
  WarehouseForecastPageDto,
  WarehouseForecastQueryDto,
} from './forecast.dto';

const toProduct = (dto: DemandSeriesDto['product']) => ({
  id: String(dto.id),
  sku: dto.sku,
  name: dto.name,
  // The API sends the stock unit's code only; its name is only a fallback for unknown codes.
  unit: { code: dto.unit, name: dto.unit },
});

export const toDemandSeries = (dto: DemandSeriesDto): DemandSeries => ({
  product: toProduct(dto.product),
  periods: dto.periods.map((period) => ({ start: period.periodStart, quantity: period.quantity })),
  total: dto.total,
  noHistory: dto.notice === 'NO_HISTORY',
});

const FORECAST_STATUS = { OK: 'ok', ERROR: 'error', NO_FORECAST: 'no_forecast' } as const;

export const toForecast = (dto: ForecastDto): Forecast => ({
  id: String(dto.id),
  runId: String(dto.runId),
  historyEnd: dto.historyEnd,
  warehouse: { id: String(dto.warehouse.id), name: dto.warehouse.name },
  status: FORECAST_STATUS[dto.status],
  reason: dto.reason,
  modelName: dto.modelName,
  demandClass: dto.demandClass,
  total: dto.total,
  periods: dto.periods.map(({ periodStart, estimate, lower, upper }) => ({
    start: periodStart,
    estimate,
    lower,
    upper,
  })),
  warnings: dto.warnings,
  error: dto.error,
  isCurrent: dto.isCurrent,
  createdAt: dto.createdAt,
});

const RUN_STATUS: Record<ForecastRunDto['status'], RunStatus> = {
  RUNNING: 'running',
  COMPLETED: 'completed',
  PARTIAL: 'partial',
  FAILED: 'failed',
};

export const toForecastRun = (dto: ForecastRunDto): ForecastRun => ({
  id: String(dto.id),
  status: RUN_STATUS[dto.status],
  horizon: dto.horizon,
  historyEnd: dto.historyEnd,
  startedBy: dto.startedBy?.name ?? null,
  seriesTotal: dto.seriesTotal,
  seriesOk: dto.seriesOk,
  seriesError: dto.seriesError,
  seriesNoForecast: dto.seriesNoForecast,
  errorMessage: dto.errorMessage,
  startedAt: dto.startedAt,
  finishedAt: dto.finishedAt,
});

export function toStartRunDto(input: StartRunInput): StartForecastRunDto {
  const dto: StartForecastRunDto = {};
  if (input.warehouseId) dto.warehouseId = Number(input.warehouseId);
  if (input.productId) dto.productId = Number(input.productId);
  return dto;
}

export const toWarehouseForecastPage = (dto: WarehouseForecastPageDto): WarehouseForecastPage => ({
  items: dto.items.map((item) => ({
    product: toProduct(item.product),
    current: item.current && toForecast(item.current),
    latest: item.latest && toForecast(item.latest),
  })),
  total: dto.total,
  summary: {
    products: dto.summary.products,
    ok: dto.summary.ok,
    no_forecast: dto.summary.noForecast,
    error: dto.summary.error,
    none: dto.summary.none,
  },
});

const STATUS_TO_DTO = {
  ok: 'OK',
  no_forecast: 'NO_FORECAST',
  error: 'ERROR',
  none: 'NONE',
} as const;

export function toWarehouseForecastQuery(
  filters: WarehouseForecastFilters,
): WarehouseForecastQueryDto {
  const query: WarehouseForecastQueryDto = {
    sort: filters.sort === 'estimate' ? 'ESTIMATE' : 'NAME',
    page: filters.page,
    pageSize: filters.pageSize,
  };
  if (filters.search.trim()) query.search = filters.search.trim();
  if (filters.status) query.status = STATUS_TO_DTO[filters.status];
  return query;
}
