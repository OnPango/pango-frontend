import {
  DEFAULT_LEAD_TIME_DAYS,
  MAX_LEAD_TIME_DAYS,
  MIN_LEAD_TIME_DAYS,
} from '@/shared/lib/reorderPoint';
import { authorize, error } from '../guard';
import type { MockRoutes } from '../server';
import {
  availableOf,
  reservedOf,
  openAlertOf,
  replenishmentOf,
  resolveReplenishmentParams,
  setReplenishment,
  stockByWarehouse,
} from '../stock';
import { findProductRow, findUnitRow } from './catalog.handlers';
import { currentOkForecastOf } from './forecasting.handlers';
import { findWarehouseRow } from './warehouses.handlers';

/**
 * Replenishment parameters per product and warehouse (`docs/replenishment.md`): read them with the
 * stock and the open alert, or set manual fallback, method (`FIXED_ROP`/`FORECAST_ROP`) and lead
 * time (alert re-evaluated).
 */

const decimals = (value: number) => (String(value).split('.')[1] ?? '').length;

function resolve(org: string, productId: string, warehouseId: string) {
  const product = findProductRow(org, Number(productId));
  if (!product?.isActive) return { error: error(404, 'PRODUCT_NOT_FOUND', 'Product not found') };
  const warehouse = findWarehouseRow(org, Number(warehouseId));
  if (!warehouse?.isActive) {
    return { error: error(404, 'WAREHOUSE_NOT_FOUND', 'Warehouse not found') };
  }
  return { product, warehouse };
}

function toDto(org: string, productId: number, warehouseId: number) {
  const product = findProductRow(org, productId)!;
  const warehouse = findWarehouseRow(org, warehouseId)!;
  const values = replenishmentOf(org, productId, warehouseId);
  const onHand = stockByWarehouse(org, productId).get(warehouseId) ?? 0;
  return {
    product: {
      id: product.id,
      sku: product.sku,
      name: product.name,
      unit: findUnitRow(product.stockUnitId)?.code ?? '',
    },
    warehouse: { id: warehouse.id, name: warehouse.name },
    onHand,
    reserved: reservedOf(org, productId, warehouseId),
    available: availableOf(org, productId, warehouseId),
    ...values,
    openAlert: openAlertOf(org, productId, warehouseId),
  };
}

export const replenishmentRoutes: MockRoutes = {
  'GET /products/:productId/warehouses/:warehouseId/replenishment': ({ params }) => {
    const auth = authorize('stock.read');
    if (auth.error) return auth.error;
    const org = auth.user.organization_id;
    const found = resolve(org, params.productId, params.warehouseId);
    if (found.error) return found.error;
    return { status: 200, data: toDto(org, found.product.id, found.warehouse.id) };
  },

  'PUT /products/:productId/warehouses/:warehouseId/replenishment': ({ params, body }) => {
    const auth = authorize('replenishment.manage');
    if (auth.error) return auth.error;
    const org = auth.user.organization_id;
    const found = resolve(org, params.productId, params.warehouseId);
    if (found.error) return found.error;

    const input = (body ?? {}) as Record<string, unknown>;
    const problems: string[] = [];
    const quantity = (field: string, optional: boolean) => {
      const value = input[field];
      if (optional && (value === undefined || value === null)) return;
      if (typeof value !== 'number' || value < 0 || decimals(value) > 4) {
        problems.push(`${field} must not be less than 0`);
      }
    };
    quantity('safetyStock', false);
    quantity('reorderPoint', false);
    quantity('minStock', true);
    quantity('maxStock', true);
    if (
      input.replenishmentMethod !== undefined &&
      input.replenishmentMethod !== 'FIXED_ROP' &&
      input.replenishmentMethod !== 'FORECAST_ROP'
    ) {
      problems.push('replenishmentMethod must be FIXED_ROP or FORECAST_ROP');
    }
    if (
      input.leadTimeDays !== undefined &&
      (typeof input.leadTimeDays !== 'number' ||
        !Number.isInteger(input.leadTimeDays) ||
        input.leadTimeDays < MIN_LEAD_TIME_DAYS ||
        input.leadTimeDays > MAX_LEAD_TIME_DAYS)
    ) {
      problems.push(
        `leadTimeDays must be an integer between ${MIN_LEAD_TIME_DAYS} and ${MAX_LEAD_TIME_DAYS}`,
      );
    }
    if (problems.length > 0) return error(400, 'VALIDATION', problems.join(', '));

    const safetyStock = input.safetyStock as number;
    const reorderPoint = input.reorderPoint as number;
    const minStock = (input.minStock as number | null | undefined) ?? null;
    const maxStock = (input.maxStock as number | null | undefined) ?? null;
    if (safetyStock > reorderPoint && reorderPoint > 0) {
      return error(
        400,
        'REPLENISHMENT_INVALID',
        'The safety stock cannot exceed the reorder point',
      );
    }
    if (minStock !== null && maxStock !== null && minStock > maxStock) {
      return error(400, 'REPLENISHMENT_INVALID', 'The min stock cannot exceed the max stock');
    }
    if (maxStock !== null && reorderPoint > maxStock) {
      return error(400, 'REPLENISHMENT_INVALID', 'The reorder point cannot exceed the max stock');
    }

    const current = replenishmentOf(org, found.product.id, found.warehouse.id);
    const method =
      (input.replenishmentMethod as 'FIXED_ROP' | 'FORECAST_ROP' | undefined) ??
      (current.replenishmentMethod === 'FORECAST_ROP' ? 'FORECAST_ROP' : 'FIXED_ROP');
    const leadTimeDays =
      (input.leadTimeDays as number | undefined) ?? current.leadTimeDays ?? DEFAULT_LEAD_TIME_DAYS;

    const forecast =
      method === 'FORECAST_ROP'
        ? currentOkForecastOf(org, found.product.id, found.warehouse.id)
        : null;

    setReplenishment(
      org,
      found.product.id,
      found.warehouse.id,
      resolveReplenishmentParams(
        {
          replenishmentMethod: method,
          leadTimeDays,
          manualSafetyStock: safetyStock,
          manualReorderPoint: reorderPoint,
          minStock,
          maxStock,
        },
        forecast,
      ),
    );
    return { status: 200, data: toDto(org, found.product.id, found.warehouse.id) };
  },
};
