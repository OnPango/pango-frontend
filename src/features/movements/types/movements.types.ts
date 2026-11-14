import type { UnitRef } from '@/shared/lib/units';

export interface Option {
  id: string;
  name: string;
}

export type MovementNature = 'inbound' | 'outbound' | 'adjustment' | 'transfer';

export interface MovementTypeRef {
  id: string;
  name: string;
  nature: MovementNature;
  /** Its outbound movements feed the demand history (the forecast). */
  countsAsDemand: boolean;
}

export interface MovementLine {
  lineNumber: number;
  product: { id: string; sku: string; name: string; unit: UnitRef };
  quantity: number;
  /** Stock left the warehouse (it has an origin and no destination). */
  removes: boolean;
  lot: string | null;
  /** The location stock left from, or arrived at. */
  location: string | null;
}

/** A confirmed movement of the history: immutable (RF-INV-007, RN-006). */
export interface Movement {
  id: string;
  /** `MV-00000012`. */
  number: string;
  type: MovementTypeRef;
  warehouse: Option;
  registeredBy: string | null;
  /** `stockRequest`: the outbound movement that fulfilled a stock request. */
  source: 'manual' | 'stockRequest';
  /** The requesting area, on movements that fulfil a stock request. */
  department: Option | null;
  documentRef: string | null;
  notes: string | null;
  occurredAt: string;
  lines: MovementLine[];
}

export interface MovementFilters {
  productId: string | null;
  warehouseId: string | null;
  typeId: string | null;
  /** Local days, `YYYY-MM-DD`, both included. */
  from: string | null;
  to: string | null;
  page: number;
  pageSize: number;
}

export interface MovementPage {
  items: Movement[];
  total: number;
}

export interface HistoryProduct {
  id: string;
  sku: string;
  name: string;
}
