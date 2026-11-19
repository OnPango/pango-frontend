import type { UnitRef } from '@/shared/lib/units';

export interface Option {
  id: string;
  name: string;
}

export interface ForecastProduct {
  id: string;
  sku: string;
  name: string;
  unit: UnitRef;
}

/** One week of demand: sales and consumption that fulfils stock requests. */
export interface DemandPeriod {
  /** Monday of the week, `YYYY-MM-DD`. */
  start: string;
  quantity: number;
}

/** US-37: the weekly demand of a product in a warehouse, every week of the range listed. */
export interface DemandSeries {
  product: ForecastProduct;
  periods: DemandPeriod[];
  total: number;
  /** The product has no demand at all: the series is empty on purpose, not an error. */
  noHistory: boolean;
}

export interface Interval {
  estimate: number;
  lower: number;
  upper: number;
}

export interface ForecastPeriod extends Interval {
  /** Monday of the week, `YYYY-MM-DD`. */
  start: string;
}

/**
 * `ok`: forecast; `no_forecast`: the service declined the series on purpose (`reason`);
 * `error`: it could not forecast it (`error`).
 */
export type ForecastStatus = 'ok' | 'no_forecast' | 'error';

export type DemandClass =
  'SMOOTH' | 'INTERMITTENT' | 'ERRATIC' | 'LUMPY' | 'INSUFFICIENT' | 'NOT_CLASSIFIABLE';

/** The result of one product in one warehouse in one run (US-38). */
export interface Forecast {
  id: string;
  runId: string;
  /** Last day of history used: the last complete Sunday. */
  historyEnd: string;
  warehouse: Option;
  status: ForecastStatus;
  reason: string | null;
  modelName: string | null;
  demandClass: DemandClass | null;
  /** Calibrated interval of the whole horizon (not the sum of the weeks' bounds). */
  total: Interval | null;
  periods: ForecastPeriod[];
  warnings: string[];
  error: { code: string; message: string } | null;
  /** The latest successful forecast of this product and warehouse. */
  isCurrent: boolean;
  createdAt: string;
}

export type RunStatus = 'running' | 'completed' | 'partial' | 'failed';

export interface ForecastRun {
  id: string;
  status: RunStatus;
  /** Weeks forecast. */
  horizon: number;
  historyEnd: string;
  startedBy: string | null;
  seriesTotal: number;
  seriesOk: number;
  seriesError: number;
  seriesNoForecast: number;
  /** Why the run failed; nothing is stored from a failed run. */
  errorMessage: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface ForecastRunPage {
  items: ForecastRun[];
  total: number;
}

/** Without a warehouse or product, the run covers every active one. */
export interface StartRunInput {
  warehouseId: string | null;
  productId: string | null;
}

/** One product enabled in a warehouse and where its forecast stands there. */
export interface WarehouseForecastRow {
  product: ForecastProduct;
  /** The latest successful forecast, which a later error does not replace. */
  current: Forecast | null;
  /** The newest result, whatever its status; null when the product was never forecast here. */
  latest: Forecast | null;
}

/** `none`: never forecast in the warehouse. The other statuses are the latest result's. */
export type WarehouseForecastStatus = ForecastStatus | 'none';

export type WarehouseForecastSort = 'name' | 'estimate';

export interface WarehouseForecastFilters {
  warehouseId: string;
  search: string;
  status: WarehouseForecastStatus | null;
  sort: WarehouseForecastSort;
  page: number;
  pageSize: number;
}

export interface WarehouseForecastPage {
  items: WarehouseForecastRow[];
  total: number;
  /** Every product of the warehouse, whatever the filters. */
  summary: Record<WarehouseForecastStatus, number> & { products: number };
}
