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
  isActive: boolean;
}

export interface ProductPageDto {
  items: ProductDto[];
  total: number;
}

/** `GET /products/:id`. */
export type ValueSourceDto = 'MANUAL' | 'CALCULATED';

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
  safetyStock: number;
  reorderPoint: number;
  minStock: number | null;
  maxStock: number | null;
  valueSource: ValueSourceDto;
  openAlert: { id: number; severity: number; createdAt: string } | null;
}

export interface SetReplenishmentDto {
  safetyStock: number;
  reorderPoint: number;
  minStock: number | null;
  maxStock: number | null;
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
  warehouseId: number;
  documentRef?: string;
  notes?: string;
  lines: {
    productId: number;
    quantity: number;
    lotCode?: string;
    locationId?: number;
    /** Only on adjustment lines, and required there. */
    direction?: 'INCREASE' | 'DECREASE';
  }[];
}

/** The answer of `POST /movements` (only what the screen reads). */
export interface MovementDto {
  id: number;
  number: string;
  movementType: { id: number; name: string; nature: MovementNatureDto };
  warehouse: { id: number; name: string };
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

/** `GET /products/:id/lots`. */
export interface LotDto {
  id: number;
  code: string;
  manufactureDate: string | null;
  expiryDate: string | null;
  onHand: number;
}
