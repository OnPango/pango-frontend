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

/** US-015: a product's stock, in total and per warehouse where it is enabled. */
export interface ProductStock {
  product: StockProduct;
  /** Inbound minus outbound, across every warehouse. */
  totalOnHand: number;
  warehouses: { warehouse: { id: string; name: string }; onHand: number }[];
}

/** One product in a warehouse's stock list. */
export interface WarehouseStockRow {
  product: StockProduct;
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
