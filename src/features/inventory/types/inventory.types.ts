import type { UnitRef } from '@/shared/lib/units';

/** A product as the stock screens need it: to pick it and to read its quantities. */
export interface StockProduct {
  id: string;
  sku: string;
  name: string;
  unit: UnitRef;
  /** Name of its family. */
  family: string;
  /** Each inbound and outbound movement asks for the lot. */
  tracksLots: boolean;
  isActive: boolean;
}

/** Set by hand (US-016) or computed by the forecast (US-040). */
export type ValueSource = 'manual' | 'calculated';

/** US-015: a product's stock, in total and per warehouse where it is enabled. */
export interface ProductStock {
  product: StockProduct;
  /** Inbound minus outbound, across every warehouse. */
  totalOnHand: number;
  warehouses: {
    warehouse: { id: string; name: string };
    onHand: number;
    safetyStock: number;
    /** 0: none, no alerts. */
    reorderPoint: number;
    source: ValueSource;
  }[];
}

/** US-016: a product's replenishment values in one warehouse, with the stock they compare to. */
export interface Replenishment {
  onHand: number;
  /** Held by stock requests in progress. */
  reserved: number;
  /** On hand minus reserved: what the reorder point is compared against. */
  available: number;
  safetyStock: number;
  reorderPoint: number;
  minStock: number | null;
  maxStock: number | null;
  source: ValueSource;
  /** 1 at or below the reorder point, 2 at or below the safety stock, 3 nothing available. */
  openAlert: { severity: 1 | 2 | 3; createdAt: string } | null;
}

export interface SetReplenishmentInput {
  safetyStock: number;
  reorderPoint: number;
  minStock: number | null;
  maxStock: number | null;
}

/** One product in a warehouse's stock list (`GET /stock`). */
export interface WarehouseStockRow {
  product: StockProduct;
  onHand: number;
  /** Held by stock requests in attention. */
  reserved: number;
  /** On hand minus reserved: what can still go out, and what the reorder point compares to. */
  available: number;
}

/** A lot of a product with stock in a warehouse (`GET /products/:id/lots`). */
export interface ProductLot {
  id: string;
  code: string;
  /** `YYYY-MM-DD`. */
  manufactureDate: string | null;
  /** `YYYY-MM-DD`. */
  expiryDate: string | null;
  onHand: number;
}

/** `PATCH /products/:id/lots/:lotId`: both dates are sent; null clears one. */
export interface UpdateLotDatesInput {
  productId: string;
  lotId: string;
  /** `YYYY-MM-DD`. */
  manufactureDate: string | null;
  /** `YYYY-MM-DD`, not before the manufacture date. */
  expiryDate: string | null;
}

export interface WarehouseOption {
  id: string;
  name: string;
  code: string;
}

/** Inbound adds stock, outbound removes it. Adjustments and transfers have their own forms. */
export type MovementKind = 'inbound' | 'outbound';

/** What a stock row offers to register: a movement, an adjustment from a count, or a transfer. */
export type StockAction = MovementKind | 'adjustment' | 'transfer';

/** The reason of a movement (`Purchase receipt`, `Consumption issue`…). */
export interface MovementType {
  id: string;
  name: string;
  nature: MovementKind | 'adjustment' | 'transfer';
  /** Its outbound movements feed the demand history (the forecast). */
  countsAsDemand: boolean;
}

/** One product, one warehouse, one quantity: CU-05's main flow. */
export interface RegisterMovementInput {
  movementTypeId: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  lotCode: string | null;
  documentRef: string | null;
}

/**
 * CU-16: one or more products from one warehouse to another. It stays in transit until the
 * destination receives it, unless `receiveNow` (it arrives at once; needs `movement.receive` there).
 */
export interface RegisterTransferInput {
  movementTypeId: string;
  originId: string;
  destinationId: string;
  /** A product may repeat only with different lots. */
  lines: { productId: string; quantity: number; lotCode: string | null }[];
  receiveNow: boolean;
  documentRef: string | null;
  notes: string | null;
}

export interface RegisteredMovement {
  id: string;
  /** `MV-00000012`. */
  number: string;
  kind: MovementKind | 'adjustment' | 'transfer';
  /** Where it was registered; on transfers, the origin. */
  warehouse: { id: string; name: string };
  /** Transfers: where the stock goes. */
  destination: { id: string; name: string } | null;
  /** A transfer that has not been received yet. */
  inTransit: boolean;
  /** The first line's product. */
  productId: string;
  /** Every product of its lines, once each (a transfer may carry several). */
  productIds: string[];
  /** Of every line (an adjustment may take from several locations). */
  quantity: number;
  /** Whether it took stock out (an outbound movement, or an adjustment that decreased it). */
  removes: boolean;
}

/** A product's stock in one warehouse (`GET /products/:id/stock?warehouseId=`). */
export interface WarehouseProductStock {
  productId: string;
  warehouseId: string;
  onHand: number;
  /** Held by stock requests in attention. */
  reserved: number;
  available: number;
  /** Non-zero balances, by location and lot. */
  balances: {
    locationId: string;
    lot: { code: string; expiryDate: string | null } | null;
    onHand: number;
  }[];
}

/** An adjustment adds what a count found over the stock, or removes what it found missing. */
export type AdjustmentDirection = 'increase' | 'decrease';

/** One product (and lot) in one warehouse, corrected by the difference with a count. */
export interface RegisterAdjustmentInput {
  movementTypeId: string;
  warehouseId: string;
  productId: string;
  lotCode: string | null;
  direction: AdjustmentDirection;
  /**
   * What to add (one line, to the default location), or what to remove from each location that
   * holds it (one line each: a line removes from one location).
   */
  lines: { quantity: number; locationId: string | null }[];
  notes: string;
  documentRef: string | null;
}
