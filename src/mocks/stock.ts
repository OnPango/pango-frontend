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

// Seed: Tornillo M8 (per lot) and Caja corrugada already moved in Bodega Central.
applyStock('org-pango', 1, 1, 'L-2026-10', 1200);
applyStock('org-pango', 3, 1, null, 85);
