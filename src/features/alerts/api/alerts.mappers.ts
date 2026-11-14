import type {
  AlertFilters,
  AlertResolution,
  AlertSort,
  AlertSeverity,
  AlertStatus,
  CurrentStock,
  StockAlert,
  ValueSource,
} from '../types/alerts.types';
import type { AlertDto, ReplenishmentDto } from './alerts.dto';

const STATUS: Record<AlertDto['status'], AlertStatus> = {
  OPEN: 'open',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
};
const STATUS_DTO: Record<AlertStatus, AlertDto['status']> = {
  open: 'OPEN',
  resolved: 'RESOLVED',
  dismissed: 'DISMISSED',
};

const RESOLUTION: Record<NonNullable<AlertDto['resolution']>, AlertResolution> = {
  STOCK_RECOVERED: 'stockRecovered',
  REORDER_POINT_CHANGED: 'reorderPointChanged',
  NO_REORDER_POINT: 'noReorderPoint',
  INACTIVE: 'inactive',
};
const SORT_DTO: Record<AlertSort, 'CREATED' | 'UPDATED' | 'SEVERITY'> = {
  created: 'CREATED',
  updated: 'UPDATED',
  severity: 'SEVERITY',
};

const source = (value: AlertDto['reorderPointSource']): ValueSource =>
  value === 'CALCULATED' ? 'calculated' : 'manual';

/** Anything outside 1–3 reads as the mildest one. */
const severity = (value: number): AlertSeverity => (value === 3 ? 3 : value === 2 ? 2 : 1);

export function toStockAlert(dto: AlertDto): StockAlert {
  return {
    id: String(dto.id),
    severity: severity(dto.severity),
    status: STATUS[dto.status],
    product: {
      id: String(dto.product.id),
      sku: dto.product.sku,
      name: dto.product.name,
      // The unit comes as a code only; its name is only a fallback for unknown codes.
      unit: { code: dto.product.unit, name: dto.product.unit },
    },
    warehouse: { id: String(dto.warehouse.id), name: dto.warehouse.name },
    available: dto.availableQuantity,
    reorderPoint: dto.reorderPoint,
    source: source(dto.reorderPointSource),
    suggested: dto.suggestedQuantity,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt ?? dto.createdAt,
    resolvedAt: dto.resolvedAt,
    resolution: dto.resolution ? RESOLUTION[dto.resolution] : null,
  };
}

export function toListQuery(filters: AlertFilters) {
  return {
    ...(filters.status && { status: STATUS_DTO[filters.status] }),
    // The API's default is the raised date: only send another order.
    ...(filters.sort && filters.sort !== 'created' && { sort: SORT_DTO[filters.sort] }),
    ...(filters.warehouseId && { warehouseId: Number(filters.warehouseId) }),
    ...(filters.productId && { productId: Number(filters.productId) }),
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

export function toCurrentStock(dto: ReplenishmentDto): CurrentStock {
  return {
    onHand: dto.onHand,
    reserved: dto.reserved,
    available: dto.available,
    safetyStock: dto.safetyStock,
    reorderPoint: dto.reorderPoint,
    source: source(dto.valueSource),
    openAlertId: dto.openAlert ? String(dto.openAlert.id) : null,
  };
}
