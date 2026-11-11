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
  expiryDate: string | null;
  onHand: number;
}

export interface WarehouseOption {
  id: string;
  name: string;
  code: string;
}

/** Inbound adds stock, outbound removes it. Adjustments and transfers come in later sprints. */
export type MovementKind = 'inbound' | 'outbound';

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

export interface RegisteredMovement {
  id: string;
  /** `MV-00000012`. */
  number: string;
  kind: MovementKind;
  warehouse: { id: string; name: string };
  productId: string;
  quantity: number;
}
