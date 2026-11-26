/** Shapes of pango-core's dashboard responses (`docs/dashboard.md`). */

interface RefDto {
  id: number;
  name: string;
}

/** `unit` is the stock unit's code. */
interface ProductDto {
  id: number;
  sku: string;
  name: string;
  unit: string;
}

interface TrendDto {
  current: number;
  previous: number;
}

export interface DashboardSummaryDto {
  currency: string;
  comparedTo: string;
  kpis: {
    products: TrendDto | null;
    stockValue: TrendDto | null;
    lowStock: (TrendDto & { critical: number }) | null;
    pendingRequests: (TrendDto & { pending: number; inProgress: number }) | null;
  };
  lowStockItems: {
    items: {
      alertId: number;
      severity: number;
      status: 'OPEN' | 'ATTENDED';
      product: ProductDto;
      warehouse: RefDto;
      available: number;
      reorderPoint: number;
      suggested: number;
      daysOfCover: number | null;
    }[];
    total: number;
  } | null;
  recentActivity:
    | {
        id: number;
        number: string;
        status: 'IN_TRANSIT' | 'CONFIRMED' | 'VOIDED';
        type: string;
        nature: 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | 'ADJUSTMENT';
        occurredAt: string;
        warehouse: RefDto;
        destinationWarehouse: RefDto | null;
        firstProduct: string;
        firstSku: string;
        lineCount: number;
        registeredBy: string;
      }[]
    | null;
}

export interface DashboardLevelDto {
  days: number;
  granularity: 'DAY' | 'WEEK';
  points: { start: string; end: string; inStock: number; lowStock: number | null }[];
}

/** `GET /dashboard/imported-inventory-level`: the same periods, from the imported history. */
export interface ImportedLevelDto extends DashboardLevelDto {
  lastImportedDay: string | null;
}

/** `GET /historical-movements`: only what the dashboard shows of each imported line. */
export interface ImportedMovementPageDto {
  items: {
    id: number;
    date: string;
    movementType: string;
    product: { id: number; sku: string; name: string; unit: string };
    warehouse: { id: number; code: string; name: string };
    quantityIn: number | null;
    quantityOut: number | null;
    documentRef: string | null;
    afterCutover: boolean;
    source: { importId: number; sourceNamespace: string; externalMovementId: string };
  }[];
  total: number;
}
