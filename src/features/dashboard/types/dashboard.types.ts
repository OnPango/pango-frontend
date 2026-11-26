import type { UnitRef } from '@/shared/lib/units';

export interface Ref {
  id: string;
  name: string;
}

export interface ProductRef {
  id: string;
  sku: string;
  name: string;
  unit: UnitRef;
}

/** 1 media (at or below the reorder point), 2 alta (safety stock), 3 crítica (none available). */
export type Severity = 1 | 2 | 3;

// ─── Summary ─────────────────────────────────────────────────────────────────

/** A figure now and one month earlier. */
export interface Trend {
  current: number;
  previous: number;
}

/** A figure is null when the user cannot read its module. */
export interface SummaryKpis {
  products: Trend | null;
  /** On hand × average cost, in the organization's currency. */
  stockValue: Trend | null;
  /** Alerts in force: products at or below their reorder point. */
  lowStock: (Trend & { critical: number }) | null;
  pendingRequests: (Trend & { pending: number; inProgress: number }) | null;
}

export interface ReplenishItem {
  alertId: string;
  severity: Severity;
  status: 'open' | 'attended';
  product: ProductRef;
  warehouse: Ref;
  available: number;
  reorderPoint: number;
  suggested: number;
  /** Days the stock lasts at the current forecast; null without one. */
  daysOfCover: number | null;
}

export type MovementNature = 'inbound' | 'outbound' | 'transfer' | 'adjustment';

export interface ActivityItem {
  id: string;
  number: string;
  status: 'inTransit' | 'confirmed' | 'voided';
  /** The movement type's name, as the API sends it (translated for display). */
  type: string;
  nature: MovementNature;
  occurredAt: string;
  warehouse: Ref;
  destinationWarehouse: Ref | null;
  firstProduct: string;
  firstSku: string;
  lineCount: number;
  registeredBy: string;
}

export interface DashboardSummary {
  currency: string;
  /** The moment every `previous` refers to. */
  comparedTo: string;
  kpis: SummaryKpis;
  lowStockItems: { items: ReplenishItem[]; total: number } | null;
  recentActivity: ActivityItem[] | null;
}

// ─── Inventory level ─────────────────────────────────────────────────────────

export type LevelDays = 7 | 30 | 90;

export interface LevelPoint {
  /** `YYYY-MM-DD`: first and last day of the period (the same for daily points). */
  start: string;
  end: string;
  inStock: number;
  /** Null without `alert.read`. */
  lowStock: number | null;
}

export interface InventoryLevel {
  days: LevelDays;
  granularity: 'day' | 'week';
  points: LevelPoint[];
}

/**
 * The level counted from the imported history (the company's previous system): same periods as
 * Pango's, for the product-warehouses that had not started in Pango yet. Shown labelled as imported.
 */
export interface ImportedLevel extends InventoryLevel {
  /** Latest day of the imported history, `YYYY-MM-DD`; null when nothing was imported. */
  lastImportedDay: string | null;
}

/** A line of the imported history, as the dashboard lists it. */
export interface ImportedMovementItem {
  id: string;
  /** Business day of the source, `YYYY-MM-DD`. */
  date: string;
  code: string;
  product: { id: string; sku: string; name: string; unit: string };
  warehouse: { id: string; name: string };
  /** Positive when it came in, negative when it went out. */
  quantity: number;
  document: string;
  system: string;
  /** On or after the product's first Pango movement there: shown, not counted. */
  afterCutover: boolean;
}

export interface ImportedMovementList {
  items: ImportedMovementItem[];
  total: number;
}
