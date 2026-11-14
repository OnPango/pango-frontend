/**
 * Stock on hand shared by the catalog, warehouse and movement mocks, per organization, product,
 * warehouse and lot (pango-core's `stock_balances`, without locations: everything sits in each
 * warehouse's default location). A reload starts over.
 */

const NO_LOT = '';
const key = (org: string, productId: number, warehouseId: number, lot: string) =>
  `${org}|${productId}|${warehouseId}|${lot}`;

const balances = new Map<string, number>();
/** Product ids with at least one movement line: their code and tracking are locked. */
const withMovements = new Set<string>();
/** `org|productId|lot` of every lot that exists. */
const lots = new Set<string>();

const productKey = (org: string, productId: number) => `${org}|${productId}`;

/** Adds (or, negative, removes) stock and records that the product moved. */
export function applyStock(
  org: string,
  productId: number,
  warehouseId: number,
  lot: string | null,
  delta: number,
) {
  const k = key(org, productId, warehouseId, lot ?? NO_LOT);
  balances.set(k, Number(((balances.get(k) ?? 0) + delta).toFixed(4)));
  withMovements.add(productKey(org, productId));
  if (lot) lots.add(`${org}|${productId}|${lot}`);
}

export const onHand = (org: string, productId: number, warehouseId: number, lot: string | null) =>
  balances.get(key(org, productId, warehouseId, lot ?? NO_LOT)) ?? 0;

export interface LotDates {
  /** `YYYY-MM-DD`. */
  manufactureDate: string | null;
  /** `YYYY-MM-DD`, not before the manufacture date. */
  expiryDate: string | null;
}

/** Dates of the lots that have them (`PATCH /products/:id/lots/:lotId`), by `org|productId|lot`. */
const lotDates = new Map<string, LotDates>();

export const lotDatesOf = (org: string, productId: number, lot: string): LotDates =>
  lotDates.get(`${org}|${productId}|${lot}`) ?? { manufactureDate: null, expiryDate: null };

export function setLotDates(org: string, productId: number, lot: string, dates: LotDates) {
  lotDates.set(`${org}|${productId}|${lot}`, dates);
}

/** Codes of every lot of a product, with or without stock. */
export function lotsOf(org: string, productId: number): string[] {
  const prefix = `${org}|${productId}|`;
  return [...lots].filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length));
}

/** Lots of a product with stock in a warehouse, earliest expiry first (those without one last). */
export function lotsInWarehouse(org: string, productId: number, warehouseId: number) {
  const result: ({ code: string; onHand: number } & LotDates)[] = [];
  for (const [k, quantity] of balances) {
    const [o, p, w, lot] = k.split('|');
    if (
      o === org &&
      Number(p) === productId &&
      Number(w) === warehouseId &&
      lot &&
      quantity !== 0
    ) {
      result.push({ code: lot, onHand: quantity, ...lotDatesOf(org, productId, lot) });
    }
  }
  return result.sort(
    (a, b) =>
      (a.expiryDate ?? '9999').localeCompare(b.expiryDate ?? '9999') ||
      a.code.localeCompare(b.code),
  );
}

export const lotExists = (org: string, productId: number, lot: string) =>
  lots.has(`${org}|${productId}|${lot}`);

export const hasMovements = (org: string, productId: number) =>
  withMovements.has(productKey(org, productId));

/** On hand per warehouse where the product is enabled (stock arrived there at least once). */
export function stockByWarehouse(org: string, productId: number): Map<number, number> {
  const result = new Map<number, number>();
  for (const [k, quantity] of balances) {
    const [o, p, w] = k.split('|');
    if (o === org && Number(p) === productId) {
      result.set(Number(w), Number(((result.get(Number(w)) ?? 0) + quantity).toFixed(4)));
    }
  }
  return result;
}

export function warehouseHasStock(org: string, warehouseId: number): boolean {
  for (const [k, quantity] of balances) {
    const [o, , w] = k.split('|');
    if (o === org && Number(w) === warehouseId && quantity !== 0) return true;
  }
  return false;
}

// ---- Replenishment parameters and alerts (docs/replenishment.md) ----

export interface ReplenishmentParams {
  safetyStock: number;
  reorderPoint: number;
  minStock: number | null;
  maxStock: number | null;
  valueSource: 'MANUAL' | 'CALCULATED';
}

const DEFAULT_PARAMS: ReplenishmentParams = {
  safetyStock: 0,
  reorderPoint: 0,
  minStock: null,
  maxStock: null,
  valueSource: 'MANUAL',
};

const pwKey = (org: string, productId: number, warehouseId: number) =>
  `${org}|${productId}|${warehouseId}`;

/** Product-warehouses with parameters; a `PUT` enables the product in the warehouse. */
const params = new Map<string, ReplenishmentParams>();

/**
 * Every alert raised, open or resolved (pango-core's `alerts`). It keeps the values it was raised
 * with: severity, available stock, reorder point and its source do not change while it is open.
 */
export interface AlertRow {
  id: number;
  org: string;
  productId: number;
  warehouseId: number;
  severity: 1 | 2 | 3;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  availableQuantity: number;
  reorderPoint: number;
  reorderPointSource: 'MANUAL' | 'CALCULATED';
  suggestedQuantity: number;
  createdAt: string;
  resolvedAt: string | null;
}
export const alerts: AlertRow[] = [];
let lastAlertId = 0;

export const replenishmentOf = (org: string, productId: number, warehouseId: number) =>
  params.get(pwKey(org, productId, warehouseId)) ?? DEFAULT_PARAMS;

/** Warehouse ids where the product is enabled: stock arrived there, or parameters were set. */
export function enabledWarehouses(org: string, productId: number): number[] {
  const ids = new Set(stockByWarehouse(org, productId).keys());
  for (const k of params.keys()) {
    const [o, p, w] = k.split('|');
    if (o === org && Number(p) === productId) ids.add(Number(w));
  }
  return [...ids].sort((a, b) => a - b);
}

// ---- Reservations of stock requests in attention ----

/** `org|productId|warehouseId|requestId` → quantity held by a request being attended. */
const reservations = new Map<string, number>();

export function reserve(
  org: string,
  productId: number,
  warehouseId: number,
  requestId: number,
  quantity: number,
) {
  reservations.set(`${pwKey(org, productId, warehouseId)}|${requestId}`, quantity);
}

/** Releases everything a request held (it was fulfilled or rejected). */
export function release(requestId: number) {
  for (const k of [...reservations.keys()]) if (k.endsWith(`|${requestId}`)) reservations.delete(k);
}

export function reservedOf(
  org: string,
  productId: number,
  warehouseId: number,
  exceptRequestId?: number,
) {
  const prefix = `${pwKey(org, productId, warehouseId)}|`;
  let total = 0;
  for (const [k, quantity] of reservations) {
    if (k.startsWith(prefix) && k !== `${prefix}${exceptRequestId}`) total += quantity;
  }
  return Number(total.toFixed(4));
}

/** On hand minus what requests in attention hold: what the reorder point compares to. */
export const availableOf = (org: string, productId: number, warehouseId: number) =>
  Number(
    (
      (stockByWarehouse(org, productId).get(warehouseId) ?? 0) -
      reservedOf(org, productId, warehouseId)
    ).toFixed(4),
  );

/**
 * CU-12a: available ≤ reorder point opens one alert (severity 1, 2 at or below the safety stock,
 * 3 with nothing available); above it, or with a reorder point of 0, the open alert resolves.
 */
export function evaluateAlert(org: string, productId: number, warehouseId: number) {
  const { safetyStock, reorderPoint, maxStock, valueSource } = replenishmentOf(
    org,
    productId,
    warehouseId,
  );
  const available = availableOf(org, productId, warehouseId);
  const open = openAlertRow(org, productId, warehouseId);
  const below = reorderPoint > 0 && available <= reorderPoint;
  if (below && !open) {
    alerts.push({
      id: ++lastAlertId,
      org,
      productId,
      warehouseId,
      severity: available <= 0 ? 3 : available <= safetyStock ? 2 : 1,
      status: 'OPEN',
      availableQuantity: available,
      reorderPoint,
      reorderPointSource: valueSource,
      // Up to the max stock, or to the reorder point without one.
      suggestedQuantity: Number(Math.max(0, (maxStock ?? reorderPoint) - available).toFixed(4)),
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    });
  } else if (!below && open) {
    open.status = 'RESOLVED';
    open.resolvedAt = new Date().toISOString();
  }
}

const openAlertRow = (org: string, productId: number, warehouseId: number) =>
  alerts.find(
    (a) =>
      a.org === org &&
      a.productId === productId &&
      a.warehouseId === warehouseId &&
      a.status === 'OPEN',
  );

export function openAlertOf(org: string, productId: number, warehouseId: number) {
  const open = openAlertRow(org, productId, warehouseId);
  return open ? { id: open.id, severity: open.severity, createdAt: open.createdAt } : null;
}

export function setReplenishment(
  org: string,
  productId: number,
  warehouseId: number,
  values: ReplenishmentParams,
) {
  params.set(pwKey(org, productId, warehouseId), values);
  evaluateAlert(org, productId, warehouseId);
}

// Seed: Tornillo M8 (per lot) and Caja corrugada already moved in Bodega Central.
applyStock('org-pango', 1, 1, 'L-2026-10', 1200);
applyStock('org-pango', 3, 1, null, 85);

// Tornillo M8 has values computed by the forecast. A higher reorder point first raised an alert,
// resolved when the forecast lowered it: one resolved alert in the history.
setReplenishment('org-pango', 1, 1, {
  ...DEFAULT_PARAMS,
  safetyStock: 300,
  reorderPoint: 1300,
  maxStock: 2000,
  valueSource: 'CALCULATED',
});
setReplenishment('org-pango', 1, 1, {
  ...DEFAULT_PARAMS,
  safetyStock: 200,
  reorderPoint: 500,
  valueSource: 'CALCULATED',
});
// Caja corrugada sits below its reorder point (medium); Cable USB has none left in Tienda Norte
// (critical).
setReplenishment('org-pango', 3, 1, { ...DEFAULT_PARAMS, safetyStock: 10, reorderPoint: 120 });
setReplenishment('org-pango', 4, 2, {
  ...DEFAULT_PARAMS,
  safetyStock: 5,
  reorderPoint: 20,
  maxStock: 60,
});

// Spread the seeded alerts over the last days, so the list reads like a real one.
const daysAgo = (days: number, hour: number) =>
  new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 11) +
  `${String(hour).padStart(2, '0')}:15:00.000Z`;
alerts[0].createdAt = daysAgo(9, 14);
alerts[0].resolvedAt = daysAgo(6, 10);
alerts[1].createdAt = daysAgo(3, 16);
alerts[2].createdAt = daysAgo(1, 9);
