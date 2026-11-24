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
  /** On transfers, what was sent. */
  quantity: number;
  /** Stock left the warehouse (it has an origin and no destination). */
  removes: boolean;
  lot: string | null;
  /** The location stock left from, or arrived at; on transfers, where it left from. */
  location: string | null;
  /** Transfers: what arrived; null while in transit and on other movements. */
  receivedQuantity: number | null;
  /**
   * Cost of one unit: what an entry declared, or the average cost the stock left at. 0 when no
   * cost was known yet.
   */
  unitCost: number;
}

/**
 * `confirmed`: done. `inTransit`: a transfer that left its origin and waits for the destination to
 * receive it (CU-16).
 */
export type MovementStatus = 'confirmed' | 'inTransit' | 'draft' | 'voided';

/** A movement of the history: immutable (RF-INV-007, RN-006); a transfer is received once. */
export interface Movement {
  id: string;
  /** `MV-00000012`. */
  number: string;
  type: MovementTypeRef;
  status: MovementStatus;
  /** Where it was registered; on transfers, the origin. */
  warehouse: Option;
  /** Transfers: where the stock goes. */
  destination: Option | null;
  registeredBy: string | null;
  /** Transfers: who received it, and when. */
  received: { by: string | null; at: string } | null;
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
  /** Only transfers on their way to this warehouse (`IN_TRANSIT`). */
  incomingTo?: string | null;
  /** Only transfers on their way (`IN_TRANSIT`), wherever they go. */
  inTransit?: boolean;
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
