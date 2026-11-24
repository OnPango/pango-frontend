/**
 * Bodies of the endpoints the stock screens use (`docs/catalog.md`, `docs/warehouses.md`,
 * `docs/movements.md` in pango-core), only with the fields they read.
 */

export interface UnitDto {
  id: number;
  code: string;
  name: string;
}

/** A product in `GET /products`. */
export interface ProductDto {
  id: number;
  sku: string;
  name: string;
  stockUnit: UnitDto;
  category: { id: number; name: string };
  tracksLots: boolean;
  /** Weighted average cost of one stock unit; absent before pango-core exposed it. */
  averageCost?: number;
  isActive: boolean;
}

export interface ProductPageDto {
  items: ProductDto[];
  total: number;
}

/** `GET /products/:id`. */
export type ValueSourceDto = 'MANUAL' | 'CALCULATED';
export type ReplenishmentMethodDto = 'MIN_MAX' | 'FIXED_ROP' | 'FORECAST_ROP';
export type ReorderMethodDto = 'FIXED_ROP' | 'FORECAST_ROP';
export type CalculationIssueDto = 'NO_FORECAST' | 'NO_INTERVAL' | 'NO_LEAD_TIME';

export interface ProductDetailDto extends ProductDto {
  totalOnHand: number;
  warehouses: {
    warehouse: { id: number; name: string };
    onHand: number;
    safetyStock: number;
    reorderPoint: number;
    valueSource: ValueSourceDto;
  }[];
}

/** `GET` / `PUT /products/:productId/warehouses/:warehouseId/replenishment`. */
export interface ReplenishmentDto {
  onHand: number;
  reserved: number;
  available: number;
  replenishmentMethod: ReplenishmentMethodDto;
  leadTimeDays: number;
  safetyStock: number;
  reorderPoint: number;
  manualSafetyStock: number;
  manualReorderPoint: number;
  minStock: number | null;
  maxStock: number | null;
  valueSource: ValueSourceDto;
  baseForecastId: number | null;
  calculatedAt: string | null;
  calculationIssue: CalculationIssueDto | null;
  openAlert: { id: number; severity: number; createdAt: string } | null;
}

export interface SetReplenishmentDto {
  safetyStock: number;
  reorderPoint: number;
  minStock: number | null;
  maxStock: number | null;
  replenishmentMethod: ReorderMethodDto;
  leadTimeDays: number;
}

/** Minimal slice of `GET /products/:id/forecasts` for live system reorder preview. */
export interface ForecastPreviewPageDto {
  items: {
    id: number;
    status: 'OK' | 'ERROR' | 'NO_FORECAST';
    isCurrent: boolean;
    historyEnd: string;
    createdAt: string;
    total: { estimate: number; lower: number; upper: number } | null;
    periods: { periodStart: string }[];
  }[];
}

/** `GET /warehouses`. */
export interface WarehouseDto {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

export type MovementNatureDto = 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | 'ADJUSTMENT';

/** `GET /movement-types`. */
export interface MovementTypeDto {
  id: number;
  name: string;
  nature: MovementNatureDto;
  countsAsDemand: boolean;
}

/** `POST /movements`. */
export interface CreateMovementDto {
  movementTypeId: number;
  /** On transfers, the origin. */
  warehouseId: number;
  /** Transfers only, and required there. */
  destinationWarehouseId?: number;
  /** Transfers only: arrives at once instead of staying in transit. */
  receiveNow?: boolean;
  documentRef?: string;
  notes?: string;
  lines: {
    productId: number;
    quantity: number;
    lotCode?: string;
    locationId?: number;
    /** Lines that add stock: updates the product's weighted average cost. */
    unitCost?: number;
    /** Only on adjustment lines, and required there. */
    direction?: 'INCREASE' | 'DECREASE';
  }[];
}

/** The answer of `POST /movements` (only what the screen reads). */
export interface MovementDto {
  id: number;
  number: string;
  status: 'DRAFT' | 'IN_TRANSIT' | 'CONFIRMED' | 'VOIDED';
  movementType: { id: number; name: string; nature: MovementNatureDto };
  warehouse: { id: number; name: string };
  /** Transfers: the warehouse the stock goes to. */
  destinationWarehouse: { id: number; name: string } | null;
  /** A line that removes stock has an origin location and no destination. */
  lines: {
    product: { id: number };
    quantity: number;
    originLocation: { id: number } | null;
    destinationLocation: { id: number } | null;
  }[];
}

/** `GET /products/:id/stock?warehouseId=`. */
export interface WarehouseProductStockDto {
  product: { id: number };
  warehouse: { id: number };
  onHand: number;
  reserved: number;
  available: number;
  balances: {
    location: { id: number; code: string };
    lot: { id: number; code: string; expiryDate: string | null } | null;
    onHand: number;
  }[];
}

/** `GET /stock`: products with stock in a warehouse. */
export interface StockPageDto {
  items: { product: ProductDto; onHand: number; reserved: number; available: number }[];
  total: number;
  page: number;
  pageSize: number;
}

/** `GET /movements` page, only to count transfers on their way to a warehouse. */
export interface MovementCountDto {
  total: number;
}

/** `GET /products/:id/lots`. */
export interface LotDto {
  id: number;
  code: string;
  manufactureDate: string | null;
  expiryDate: string | null;
  onHand: number;
}
