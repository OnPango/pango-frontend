/**
 * Bodies of the demand and forecasting endpoints (`docs/demand.md` and `docs/forecasting.md` in
 * pango-core), as the API names them. Only `forecast.mappers.ts` and `forecast.api.ts` know them.
 */

interface RefDto {
  id: number;
  name: string;
}

/** `GET /products/:id/demand`. */
export interface DemandSeriesDto {
  product: { id: number; sku: string; name: string; unit: string };
  warehouse: RefDto | null;
  granularity: 'WEEKLY' | 'MONTHLY';
  timeZone: string;
  from: string | null;
  to: string | null;
  total: number;
  periods: { periodStart: string; quantity: number }[];
  notice: 'NO_HISTORY' | null;
}

interface IntervalDto {
  estimate: number;
  lower: number;
  upper: number;
}

export interface ForecastDto {
  id: number;
  runId: number;
  historyEnd: string;
  warehouse: RefDto;
  status: 'OK' | 'ERROR' | 'NO_FORECAST';
  reason: string | null;
  modelName: string | null;
  modelVersion: string | null;
  demandClass:
    'SMOOTH' | 'INTERMITTENT' | 'ERRATIC' | 'LUMPY' | 'INSUFFICIENT' | 'NOT_CLASSIFIABLE' | null;
  total: IntervalDto | null;
  periods: (IntervalDto & { periodStart: string })[];
  profile: Record<string, unknown> | null;
  warnings: string[];
  horizonBusinessDays: number[];
  error: { code: string; message: string } | null;
  isCurrent: boolean;
  createdAt: string;
}

export interface ForecastPageDto {
  items: ForecastDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ForecastRunDto {
  id: number;
  requestId: string;
  status: 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
  granularity: 'WEEKLY' | 'MONTHLY';
  horizon: number;
  historyEnd: string;
  startedBy: { id: number; name: string | null } | null;
  seriesTotal: number;
  seriesOk: number;
  seriesError: number;
  seriesNoForecast: number;
  policyVersion: string | null;
  serviceVersion: string | null;
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface ForecastRunPageDto {
  items: ForecastRunDto[];
  total: number;
  page: number;
  pageSize: number;
}

/** `POST /forecast-runs`. */
export interface StartForecastRunDto {
  warehouseId?: number;
  productId?: number;
}

/** `GET /warehouses` and `GET /products`, only what the selectors need. */
export interface WarehouseDto {
  id: number;
  name: string;
  isActive: boolean;
}

export interface ProductPageDto {
  items: { id: number; sku: string; name: string; isActive: boolean }[];
  total: number;
}
