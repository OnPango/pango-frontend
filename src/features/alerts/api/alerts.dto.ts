/** Shapes of pango-core's alert and replenishment responses (`docs/replenishment.md`). */

type ValueSourceDto = 'MANUAL' | 'CALCULATED';

export interface AlertDto {
  id: number;
  type: 'BELOW_ROP' | 'STOCKOUT' | 'OVERSTOCK';
  severity: number;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  /** `unit` is the stock unit's code. */
  product: { id: number; sku: string; name: string; unit: string };
  warehouse: { id: number; name: string };
  availableQuantity: number;
  reorderPoint: number;
  reorderPointSource: ValueSourceDto;
  suggestedQuantity: number;
  /** In English: not shown. */
  message: string;
  createdAt: string;
  /** Last change: values refreshed while open, or resolution. Absent before `alert_updated_at`. */
  updatedAt?: string;
  resolvedAt: string | null;
  /** Why it was resolved; absent before `alert_resolution`, null while open or for older ones. */
  resolution?: 'STOCK_RECOVERED' | 'REORDER_POINT_CHANGED' | 'NO_REORDER_POINT' | 'INACTIVE' | null;
}

export interface AlertPageDto {
  items: AlertDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReplenishmentDto {
  onHand: number;
  reserved: number;
  available: number;
  safetyStock: number;
  reorderPoint: number;
  valueSource: ValueSourceDto;
  openAlert: { id: number; severity: number; createdAt: string } | null;
}

export interface WarehouseDto {
  id: number;
  name: string;
  isActive: boolean;
}

export interface ProductPageDto {
  items: { id: number; sku: string; name: string }[];
  total: number;
}
