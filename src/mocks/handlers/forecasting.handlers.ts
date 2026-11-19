import { authorize, error } from '../guard';
import { numericId } from '../ids';
import type { MockRoutes } from '../server';
import { findProductRow, findUnitRow, productsOf } from './catalog.handlers';
import { activeWarehousesOf, findWarehouseRow } from './warehouses.handlers';

/**
 * Demand history and forecast runs (`docs/demand.md`, `docs/forecasting.md`), and the proposed
 * `GET /warehouses/:id/forecasts`. The demand is synthetic but stable per product and warehouse,
 * and every active product counts as enabled in every active warehouse, so the lists have rows. A
 * run "takes" a few seconds and then forecasts every series, as the Python service would.
 */

/** Enabled pairs: every active product in every active warehouse. */
const warehouseIdsOf = (org: string) => activeWarehousesOf(org).map((row) => row.id);

const DAY = 86_400_000;
const HORIZON = 4;
const RUN_MS = 8_000;
const HISTORY_START = Date.UTC(2026, 2, 2); // A Monday.

const toDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const todayUtc = () => {
  const now = new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
};
const mondayOf = (ms: number) => ms - ((new Date(ms).getUTCDay() + 6) % 7) * DAY;
const lastCompleteSunday = () => mondayOf(todayUtc()) - DAY;

function generator(seed: number) {
  let state = seed % 2147483647 || 1;
  return () => (state = (state * 16807) % 2147483647) / 2147483647;
}

/** Week start → demand. Every fifth product has none; every third is intermittent. */
function weeklyDemand(productId: number, warehouseId: number): Map<number, number> {
  const weeks = new Map<number, number>();
  if (productId % 5 === 4) return weeks;
  const random = generator(productId * 7919 + warehouseId * 104729);
  const base = 6 + ((productId * 13 + warehouseId * 5) % 25);
  const intermittent = productId % 3 === 0;
  const thisWeek = mondayOf(todayUtc());
  const elapsed = ((todayUtc() - thisWeek) / DAY + 1) / 7;
  for (let week = HISTORY_START, i = 0; week <= thisWeek; week += 7 * DAY, i++) {
    const r = random();
    let quantity = intermittent
      ? r < 0.45
        ? 0
        : Math.round(base * (0.6 + random() * 0.8))
      : Math.max(0, Math.round(base * (1 + 0.25 * Math.sin(i / 3) + (r - 0.5) * 0.5)));
    if (week === thisWeek) quantity = Math.round(quantity * elapsed);
    weeks.set(week, quantity);
  }
  return weeks;
}

function sumDemand(productId: number, warehouseIds: number[]): Map<number, number> {
  const total = new Map<number, number>();
  for (const warehouseId of warehouseIds) {
    for (const [week, quantity] of weeklyDemand(productId, warehouseId)) {
      total.set(week, (total.get(week) ?? 0) + quantity);
    }
  }
  return total;
}

// ---- Runs and results ----

type RunStatus = 'RUNNING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';

interface RunRow {
  id: number;
  org: string;
  status: RunStatus;
  historyEnd: number;
  startedBy: { id: number; name: string } | null;
  series: { productId: number; warehouseId: number }[];
  seriesOk: number;
  seriesError: number;
  seriesNoForecast: number;
  errorMessage: string | null;
  startedAt: number;
  finishedAt: number | null;
}

interface Interval {
  estimate: number;
  lower: number;
  upper: number;
}

interface ForecastRow {
  id: number;
  org: string;
  runId: number;
  productId: number;
  warehouseId: number;
  status: 'OK' | 'ERROR' | 'NO_FORECAST';
  reason: string | null;
  modelName: string | null;
  demandClass: string | null;
  total: Interval | null;
  periods: (Interval & { periodStart: string })[];
  warnings: string[];
  error: { code: string; message: string } | null;
  isCurrent: boolean;
  historyEnd: number;
  createdAt: number;
}

const runs: RunRow[] = [];
const forecasts: ForecastRow[] = [];
const seeded = new Set<string>();

const round = (value: number) => Math.round(value * 10) / 10;

function forecastSeries(run: RunRow, productId: number, warehouseId: number, at: number) {
  const base = {
    id: forecasts.length + 1,
    org: run.org,
    runId: run.id,
    productId,
    warehouseId,
    reason: null,
    modelName: null,
    demandClass: null,
    total: null,
    periods: [],
    warnings: [],
    error: null,
    isCurrent: false,
    historyEnd: run.historyEnd,
    createdAt: at,
  };
  const product = findProductRow(run.org, productId);
  if (!product?.isActive) {
    return { ...base, status: 'NO_FORECAST' as const, reason: 'inactive' };
  }
  // The drill in the store is sold to order: the service declines it there.
  if (productId === 8 && warehouseId === 2) {
    return { ...base, status: 'NO_FORECAST' as const, reason: 'sold_to_order' };
  }
  const history = [...weeklyDemand(productId, warehouseId)]
    .filter(([week]) => week + 6 * DAY <= run.historyEnd)
    .map(([, quantity]) => quantity);
  if (history.filter((q) => q > 0).length < 6) {
    return {
      ...base,
      status: 'ERROR' as const,
      demandClass: 'INSUFFICIENT',
      error: {
        code: 'INSUFFICIENT_HISTORY',
        message: 'The series does not contain enough observable history.',
      },
    };
  }
  const recent = history.slice(-12);
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const sd = Math.sqrt(recent.reduce((a, b) => a + (b - mean) ** 2, 0) / recent.length);
  const zeros = recent.filter((q) => q === 0).length / recent.length;
  const cv2 = mean > 0 ? (sd / mean) ** 2 : 0;
  const demandClass =
    zeros > 0.3 ? (cv2 > 0.49 ? 'LUMPY' : 'INTERMITTENT') : cv2 > 0.49 ? 'ERRATIC' : 'SMOOTH';
  const periods = Array.from({ length: HORIZON }, (_, i) => {
    const estimate = round(mean * (1 + 0.04 * Math.sin(i)));
    return {
      periodStart: toDay(run.historyEnd + DAY + i * 7 * DAY),
      estimate,
      lower: round(Math.max(0, estimate - 1.28 * sd)),
      upper: round(estimate + 1.28 * sd),
    };
  });
  const sum = periods.reduce((a, p) => a + p.estimate, 0);
  return {
    ...base,
    status: 'OK' as const,
    modelName: zeros > 0.3 ? 'croston' : 'ets',
    demandClass,
    total: {
      estimate: round(sum),
      lower: round(Math.max(0, sum - 1.28 * sd * 2)),
      upper: round(sum + 1.28 * sd * 2),
    },
    periods,
    warnings: zeros > 0.3 ? ['Many weeks without demand: the interval is wide.'] : [],
  };
}

function finish(run: RunRow, at: number) {
  for (const { productId, warehouseId } of run.series) {
    const row: ForecastRow = forecastSeries(run, productId, warehouseId, at);
    if (row.status !== 'ERROR') {
      for (const other of forecasts) {
        if (
          other.org === run.org &&
          other.productId === productId &&
          other.warehouseId === warehouseId
        )
          other.isCurrent = false;
      }
      row.isCurrent = row.status === 'OK';
    }
    forecasts.push(row);
    if (row.status === 'OK') run.seriesOk++;
    else if (row.status === 'ERROR') run.seriesError++;
    else run.seriesNoForecast++;
  }
  run.status = run.seriesError > 0 ? 'PARTIAL' : 'COMPLETED';
  run.finishedAt = at;
}

function seriesOf(org: string, warehouseId?: number, productId?: number) {
  return productsOf(org)
    .filter((product) => product.isActive && (!productId || product.id === productId))
    .flatMap((product) =>
      warehouseIdsOf(org)
        .filter((id) => !warehouseId || id === warehouseId)
        .map((id) => ({ productId: product.id, warehouseId: id })),
    );
}

/**
 * Three runs to start with: one five weeks ago (its weeks have closed, to compare them with what
 * happened), one that failed three weeks ago, and this week's. The tape (product 7) was enabled
 * later: it was never forecast.
 */
function seed(org: string) {
  if (seeded.has(org)) return;
  seeded.add(org);
  const thisMonday = mondayOf(todayUtc());
  const run = (startedAt: number, status: RunStatus, errorMessage: string | null = null) => {
    const row: RunRow = {
      id: runs.length + 1,
      org,
      status,
      historyEnd: mondayOf(startedAt) - DAY,
      startedBy: null,
      series: seriesOf(org).filter((pair) => pair.productId !== 7),
      seriesOk: 0,
      seriesError: 0,
      seriesNoForecast: 0,
      errorMessage,
      startedAt,
      finishedAt: status === 'FAILED' ? startedAt + 2 * 60_000 : null,
    };
    runs.push(row);
    if (status === 'RUNNING') finish(row, startedAt + 3 * 60_000 + 20_000);
  };
  run(thisMonday - 35 * DAY + 9 * 3_600_000, 'RUNNING');
  run(
    thisMonday - 20 * DAY + 13 * 3_600_000,
    'FAILED',
    'Forecasting service unreachable: connect ECONNREFUSED 127.0.0.1:8000',
  );
  run(thisMonday + 12 * 3_600_000, 'RUNNING');
}

/** Runs "take" `RUN_MS`: once that has passed, they finish when someone looks. */
function settle(org: string) {
  seed(org);
  const now = Date.now();
  for (const run of runs) {
    if (run.org === org && run.status === 'RUNNING' && now - run.startedAt >= RUN_MS)
      finish(run, now);
  }
}

const runDto = (run: RunRow) => ({
  id: run.id,
  requestId: `mock-run-${run.id}`,
  status: run.status,
  granularity: 'WEEKLY',
  horizon: HORIZON,
  historyEnd: toDay(run.historyEnd),
  startedBy: run.startedBy,
  seriesTotal: run.series.length,
  seriesOk: run.seriesOk,
  seriesError: run.seriesError,
  seriesNoForecast: run.seriesNoForecast,
  policyVersion: run.status === 'FAILED' ? null : 'development-1',
  serviceVersion: run.status === 'FAILED' ? null : '0.1.0',
  errorMessage: run.errorMessage,
  startedAt: new Date(run.startedAt).toISOString(),
  finishedAt: run.finishedAt === null ? null : new Date(run.finishedAt).toISOString(),
});

const forecastDto = (row: ForecastRow) => ({
  id: row.id,
  runId: row.runId,
  historyEnd: toDay(row.historyEnd),
  warehouse: { id: row.warehouseId, name: findWarehouseRow(row.org, row.warehouseId)?.name ?? '' },
  status: row.status,
  reason: row.reason,
  modelName: row.modelName,
  modelVersion: row.modelName ? 'development' : null,
  demandClass: row.demandClass,
  total: row.total,
  periods: row.periods,
  profile: null,
  warnings: row.warnings,
  horizonBusinessDays: row.periods.map(() => 5),
  error: row.error,
  isCurrent: row.isCurrent,
  createdAt: new Date(row.createdAt).toISOString(),
});

function paginate<T>(items: T[], query: Record<string, string | undefined>) {
  const page = Math.max(1, Number(query.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 25)));
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

const STATUS_FILTERS = ['OK', 'NO_FORECAST', 'ERROR', 'NONE'];

export const forecastingRoutes: MockRoutes = {
  'GET /warehouses/:id/forecasts': ({ params, query }) => {
    const auth = authorize('forecast.read');
    if (auth.error) return auth.error;
    const org = auth.user.organization_id;
    settle(org);
    const warehouse = findWarehouseRow(org, Number(params.id));
    if (!warehouse || !warehouse.isActive) {
      return error(404, 'WAREHOUSE_NOT_FOUND', 'Warehouse not found');
    }
    if (query.status && !STATUS_FILTERS.includes(query.status)) {
      return error(400, 'VALIDATION_ERROR', `status must be one of: ${STATUS_FILTERS.join(', ')}`);
    }
    const ofPair = (productId: number) =>
      forecasts
        .filter(
          (row) =>
            row.org === org && row.productId === productId && row.warehouseId === warehouse.id,
        )
        .sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);
    const all = productsOf(org)
      .filter((product) => product.isActive)
      .map((product) => {
        const results = ofPair(product.id);
        const latest = results[0] ?? null;
        const current = results.find((row) => row.isCurrent) ?? null;
        return { product, latest, current, status: latest?.status ?? 'NONE' };
      });
    const count = (status: string) => all.filter((row) => row.status === status).length;
    const words = (query.search ?? '').toLowerCase().split(/\s+/).filter(Boolean);
    const list = all
      .filter((row) => !query.status || row.status === query.status)
      .filter((row) => {
        const haystack = `${row.product.sku} ${row.product.name}`.toLowerCase();
        return words.every((word) => haystack.includes(word));
      })
      .sort((a, b) =>
        query.sort === 'ESTIMATE'
          ? (b.current?.total?.estimate ?? -1) - (a.current?.total?.estimate ?? -1) ||
            a.product.name.localeCompare(b.product.name)
          : a.product.name.localeCompare(b.product.name),
      )
      .map(({ product, latest, current }) => ({
        product: {
          id: product.id,
          sku: product.sku,
          name: product.name,
          unit: findUnitRow(product.stockUnitId)?.code ?? 'EA',
        },
        current: current && forecastDto(current),
        latest: latest && forecastDto(latest),
      }));
    return {
      status: 200,
      data: {
        warehouse: { id: warehouse.id, name: warehouse.name },
        ...paginate(list, query),
        summary: {
          products: all.length,
          ok: count('OK'),
          noForecast: count('NO_FORECAST'),
          error: count('ERROR'),
          none: count('NONE'),
        },
      },
    };
  },

  'GET /products/:id/demand': ({ params, query }) => {
    const auth = authorize('forecast.read');
    if (auth.error) return auth.error;
    const org = auth.user.organization_id;
    const product = findProductRow(org, Number(params.id));
    if (!product) return error(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    let warehouseIds = warehouseIdsOf(org);
    let warehouse: { id: number; name: string } | null = null;
    if (query.warehouseId) {
      const row = findWarehouseRow(org, Number(query.warehouseId));
      if (!row) return error(404, 'WAREHOUSE_NOT_FOUND', 'Warehouse not found');
      warehouse = { id: row.id, name: row.name };
      warehouseIds = warehouseIds.filter((id) => id === row.id);
    }
    const demand = sumDemand(product.id, warehouseIds);
    const unit = findUnitRow(product.stockUnitId)?.code ?? 'EA';
    const head = {
      product: { id: product.id, sku: product.sku, name: product.name, unit },
      warehouse,
      granularity: 'WEEKLY',
      timeZone: 'America/Bogota',
    };
    const weeks = [...demand.keys()].filter((week) => (demand.get(week) ?? 0) > 0);
    if (weeks.length === 0) {
      return {
        status: 200,
        data: { ...head, from: null, to: null, total: 0, periods: [], notice: 'NO_HISTORY' },
      };
    }
    const from = query.from ? mondayOf(Date.parse(`${query.from}T00:00:00Z`)) : Math.min(...weeks);
    const to = mondayOf(todayUtc());
    const periods = [];
    for (let week = from; week <= to; week += 7 * DAY) {
      periods.push({ periodStart: toDay(week), quantity: demand.get(week) ?? 0 });
    }
    return {
      status: 200,
      data: {
        ...head,
        from: toDay(from),
        to: toDay(to + 6 * DAY),
        total: periods.reduce((a, p) => a + p.quantity, 0),
        periods,
        notice: null,
      },
    };
  },

  'GET /products/:id/forecasts': ({ params, query }) => {
    const auth = authorize('forecast.read');
    if (auth.error) return auth.error;
    const org = auth.user.organization_id;
    settle(org);
    const product = findProductRow(org, Number(params.id));
    if (!product) return error(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    if (query.warehouseId && !findWarehouseRow(org, Number(query.warehouseId))) {
      return error(404, 'WAREHOUSE_NOT_FOUND', 'Warehouse not found');
    }
    const list = forecasts
      .filter((row) => row.org === org && row.productId === product.id)
      .filter((row) => !query.warehouseId || row.warehouseId === Number(query.warehouseId))
      .sort((a, b) => b.createdAt - a.createdAt || b.id - a.id)
      .map(forecastDto);
    return { status: 200, data: paginate(list, query) };
  },

  'GET /forecast-runs': ({ query }) => {
    const auth = authorize('forecast.read');
    if (auth.error) return auth.error;
    const org = auth.user.organization_id;
    settle(org);
    const list = runs
      .filter((run) => run.org === org)
      .sort((a, b) => b.startedAt - a.startedAt || b.id - a.id)
      .map(runDto);
    return { status: 200, data: paginate(list, query) };
  },

  'GET /forecast-runs/:id': ({ params }) => {
    const auth = authorize('forecast.read');
    if (auth.error) return auth.error;
    settle(auth.user.organization_id);
    const run = runs.find(
      (row) => row.org === auth.user.organization_id && row.id === Number(params.id),
    );
    if (!run) return error(404, 'FORECAST_RUN_NOT_FOUND', 'Forecast run not found');
    return { status: 200, data: runDto(run) };
  },

  'POST /forecast-runs': ({ body }) => {
    const auth = authorize('forecast.run');
    if (auth.error) return auth.error;
    const org = auth.user.organization_id;
    settle(org);
    if (runs.some((run) => run.org === org && run.status === 'RUNNING')) {
      return error(409, 'FORECAST_RUN_IN_PROGRESS', 'Another forecast run is in progress');
    }
    const input = (body ?? {}) as { warehouseId?: number; productId?: number };
    if (input.warehouseId && !findWarehouseRow(org, input.warehouseId)) {
      return error(404, 'WAREHOUSE_NOT_FOUND', 'Warehouse not found');
    }
    if (input.productId && !findProductRow(org, input.productId)?.isActive) {
      return error(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    }
    const series = seriesOf(org, input.warehouseId, input.productId);
    if (series.length === 0) {
      return error(
        400,
        'NOTHING_TO_FORECAST',
        'No product-warehouse has demand or stock to forecast',
      );
    }
    const run: RunRow = {
      id: runs.length + 1,
      org,
      status: 'RUNNING',
      historyEnd: lastCompleteSunday(),
      startedBy: { id: numericId(auth.user.id), name: auth.user.full_name },
      series,
      seriesOk: 0,
      seriesError: 0,
      seriesNoForecast: 0,
      errorMessage: null,
      startedAt: Date.now(),
      finishedAt: null,
    };
    runs.push(run);
    return { status: 202, data: runDto(run) };
  },
};
