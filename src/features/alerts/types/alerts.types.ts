import type { UnitRef } from '@/shared/lib/units';

export interface Option {
  id: string;
  name: string;
}

/** RF-ALT-001: 1 media (at or below the reorder point), 2 alta (safety stock), 3 crítica (none). */
export type AlertSeverity = 1 | 2 | 3;

/**
 * RF-ALT-004: pending until stock rises above the reorder point (resolved). Attended (US-045):
 * someone took charge; it stays in force and resolves the same way, and goes back to pending by
 * hand or when it gets worse. Dismissing is not done yet.
 */
export type AlertStatus = 'open' | 'attended' | 'resolved' | 'dismissed';

/** What a person can set by hand. */
export type AlertManualStatus = Extract<AlertStatus, 'open' | 'attended'>;

export type ValueSource = 'manual' | 'calculated';

/** Why an alert was resolved; null while open, or when it was resolved before reasons existed. */
export type AlertResolution =
  'stockRecovered' | 'reorderPointChanged' | 'noReorderPoint' | 'inactive';

/** Order of the list: raised most recently, changed most recently, or most severe first. */
export type AlertSort = 'created' | 'updated' | 'severity';

/**
 * A replenishment alert of a product in a warehouse (CU-12). While open, every evaluation refreshes
 * its values (severity, available, reorder point); once resolved they stay as they last were.
 */
export interface StockAlert {
  id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  product: { id: string; sku: string; name: string; unit: UnitRef };
  warehouse: Option;
  /** Available stock (on hand minus reservations) at its last evaluation. */
  available: number;
  reorderPoint: number;
  /** Whether that reorder point was set by hand or calculated by the forecast (US-044). */
  source: ValueSource;
  /** What brings available stock up to the max stock, or to the reorder point without one. */
  suggested: number;
  createdAt: string;
  /** When its values last changed (or it was resolved); `createdAt` until then. */
  updatedAt: string;
  resolvedAt: string | null;
  resolution: AlertResolution | null;
  /** Who marked it attended and when; null while pending (kept once resolved). */
  attendedAt: string | null;
  attendedBy: Option | null;
}

export interface AlertFilters {
  status: AlertStatus | null;
  /** Absent: most recently raised first. */
  sort?: AlertSort;
  warehouseId: string | null;
  productId: string | null;
  page: number;
  pageSize: number;
}

export interface AlertPage {
  items: StockAlert[];
  total: number;
}

/** Where the product stands now in the alert's warehouse, to compare with when it was raised. */
export interface CurrentStock {
  onHand: number;
  reserved: number;
  available: number;
  safetyStock: number;
  reorderPoint: number;
  source: ValueSource;
  openAlertId: string | null;
}

export interface AlertProduct {
  id: string;
  sku: string;
  name: string;
}
