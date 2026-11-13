import type { UnitRef } from '@/shared/lib/units';

export interface Option {
  id: string;
  name: string;
}

/** RF-ALT-001: 1 media (at or below the reorder point), 2 alta (safety stock), 3 crítica (none). */
export type AlertSeverity = 1 | 2 | 3;

/** RF-ALT-003: pending until stock rises above the reorder point (resolved). Dismissing is S6. */
export type AlertStatus = 'open' | 'resolved' | 'dismissed';

export type ValueSource = 'manual' | 'calculated';

/**
 * A replenishment alert of a product in a warehouse (CU-12). It keeps the values it was raised
 * with: they do not follow the stock while it stays open.
 */
export interface StockAlert {
  id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  product: { id: string; sku: string; name: string; unit: UnitRef };
  warehouse: Option;
  /** Available stock (on hand minus reservations) when it was raised. */
  available: number;
  reorderPoint: number;
  /** Whether that reorder point was set by hand or calculated by the forecast (US-044). */
  source: ValueSource;
  /** What brings available stock up to the max stock, or to the reorder point without one. */
  suggested: number;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AlertFilters {
  status: AlertStatus | null;
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
