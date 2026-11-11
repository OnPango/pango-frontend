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

/** Lots of a product with stock in a warehouse, by code. */
export function lotsInWarehouse(org: string, productId: number, warehouseId: number) {
  const result: { code: string; onHand: number }[] = [];
  for (const [k, quantity] of balances) {
    const [o, p, w, lot] = k.split('|');
    if (
      o === org &&
      Number(p) === productId &&
      Number(w) === warehouseId &&
      lot &&
      quantity !== 0
    ) {
      result.push({ code: lot, onHand: quantity });
    }
  }
  return result.sort((a, b) => a.code.localeCompare(b.code));
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
const openAlerts = new Map<string, { id: number; severity: number; createdAt: string }>();
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

/** No reservations in the mock: available is on hand. */
export const availableOf = (org: string, productId: number, warehouseId: number) =>
  stockByWarehouse(org, productId).get(warehouseId) ?? 0;

/**
 * CU-12a: available ≤ reorder point opens one alert (severity 1, 2 at or below the safety stock,
 * 3 with nothing available); above it, or with a reorder point of 0, the open alert resolves.
 */
export function evaluateAlert(org: string, productId: number, warehouseId: number) {
  const k = pwKey(org, productId, warehouseId);
  const { safetyStock, reorderPoint } = replenishmentOf(org, productId, warehouseId);
  const available = availableOf(org, productId, warehouseId);
  if (reorderPoint > 0 && available <= reorderPoint) {
    const severity = available <= 0 ? 3 : available <= safetyStock ? 2 : 1;
    const current = openAlerts.get(k);
    if (current) current.severity = severity;
    else openAlerts.set(k, { id: ++lastAlertId, severity, createdAt: new Date().toISOString() });
  } else {
    openAlerts.delete(k);
  }
}

export const openAlertOf = (org: string, productId: number, warehouseId: number) =>
  openAlerts.get(pwKey(org, productId, warehouseId)) ?? null;

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

// Tornillo M8 has values computed by the forecast; Caja corrugada sits below its reorder point.
setReplenishment('org-pango', 1, 1, {
  ...DEFAULT_PARAMS,
  safetyStock: 200,
  reorderPoint: 500,
  valueSource: 'CALCULATED',
});
setReplenishment('org-pango', 3, 1, { ...DEFAULT_PARAMS, safetyStock: 10, reorderPoint: 120 });
