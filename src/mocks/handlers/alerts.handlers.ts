import { authorize, error } from '../guard';
import type { MockRoutes } from '../server';
import { alerts, type AlertRow } from '../stock';
import { findProductRow, findUnitRow } from './catalog.handlers';
import { findWarehouseRow } from './warehouses.handlers';

/**
 * Stock alerts (`docs/replenishment.md`, CU-12): raised and resolved by `evaluateAlert` on every
 * movement, replenishment change and reservation; here they are only read, most recent first.
 */

function toDto(row: AlertRow) {
  const product = findProductRow(row.org, row.productId)!;
  const warehouse = findWarehouseRow(row.org, row.warehouseId)!;
  const unit = findUnitRow(product.stockUnitId)?.code ?? '';
  return {
    id: row.id,
    type: 'BELOW_ROP',
    severity: row.severity,
    status: row.status,
    product: { id: product.id, sku: product.sku, name: product.name, unit },
    warehouse: { id: warehouse.id, name: warehouse.name },
    availableQuantity: row.availableQuantity,
    reorderPoint: row.reorderPoint,
    reorderPointSource: row.reorderPointSource,
    suggestedQuantity: row.suggestedQuantity,
    // pango-core writes it in English; the frontend composes its own text.
    message: `${product.sku}: available stock ${row.availableQuantity} ${unit} is at or below the reorder point ${row.reorderPoint}`,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    resolvedAt: row.resolvedAt,
    resolution: row.resolution,
  };
}

const ORDER = {
  CREATED: (a: AlertRow, b: AlertRow) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id,
  UPDATED: (a: AlertRow, b: AlertRow) => b.updatedAt.localeCompare(a.updatedAt) || b.id - a.id,
  SEVERITY: (a: AlertRow, b: AlertRow) =>
    b.severity - a.severity || b.updatedAt.localeCompare(a.updatedAt) || b.id - a.id,
};

export const alertsRoutes: MockRoutes = {
  'GET /alerts': ({ query }) => {
    const auth = authorize('alert.read');
    if (auth.error) return auth.error;
    const status = query.status;
    if (status && !['OPEN', 'RESOLVED', 'DISMISSED'].includes(status)) {
      return error(400, 'VALIDATION_ERROR', 'status must be one of: OPEN, RESOLVED, DISMISSED');
    }
    const sort = (query.sort ?? 'CREATED') as keyof typeof ORDER;
    if (!(sort in ORDER)) {
      return error(400, 'VALIDATION_ERROR', 'sort must be one of: CREATED, UPDATED, SEVERITY');
    }
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 25)));
    const list = alerts
      .filter((row) => row.org === auth.user.organization_id)
      .filter((row) => !query.warehouseId || row.warehouseId === Number(query.warehouseId))
      .filter((row) => !query.productId || row.productId === Number(query.productId))
      .filter((row) => !status || row.status === status)
      .sort(ORDER[sort]);
    return {
      status: 200,
      data: {
        items: list.slice((page - 1) * pageSize, page * pageSize).map(toDto),
        total: list.length,
        page,
        pageSize,
      },
    };
  },

  'GET /alerts/:id': ({ params }) => {
    const auth = authorize('alert.read');
    if (auth.error) return auth.error;
    const row = alerts.find(
      (a) => a.org === auth.user.organization_id && a.id === Number(params.id),
    );
    if (!row) return error(404, 'ALERT_NOT_FOUND', 'Alert not found');
    return { status: 200, data: toDto(row) };
  },
};
