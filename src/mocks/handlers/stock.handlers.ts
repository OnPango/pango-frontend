import { authorize, error } from '../guard';
import { numericId } from '../ids';
import type { MockRoutes } from '../server';
import {
  enabledWarehouses,
  lotDatesOf,
  lotsInWarehouse,
  lotsOf,
  onHand,
  reservedOf,
  setLotDates,
  stockByWarehouse,
} from '../stock';
import {
  findCategoryRow,
  findProductRow,
  findUnitRow,
  productsOf,
  withDescendants,
} from './catalog.handlers';
import { findWarehouseRow } from './warehouses.handlers';

/**
 * Stock queries of pango-core (`docs/stock.md`): a warehouse's stock, a product's stock in a
 * warehouse and its lots there, and a lot's dates. The mock keeps everything in the warehouse's
 * default location.
 */

function stockProduct(org: string, row: NonNullable<ReturnType<typeof findProductRow>>) {
  const unit = findUnitRow(row.stockUnitId);
  const category = findCategoryRow(org, row.categoryId);
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    stockUnit: unit,
    category: { id: row.categoryId, name: category?.name ?? '' },
    tracksLots: row.tracksLots,
    isActive: row.isActive,
  };
}

function readableWarehouse(org: string, raw: string | undefined) {
  const warehouse = raw ? findWarehouseRow(org, Number(raw)) : undefined;
  return warehouse ?? null;
}

export const stockRoutes: MockRoutes = {
  'GET /stock': ({ query }) => {
    const auth = authorize('stock.read');
    if (auth.error) return auth.error;
    const org = auth.user.organization_id;
    const warehouse = readableWarehouse(org, query.warehouseId);
    if (!warehouse) return error(404, 'WAREHOUSE_NOT_FOUND', 'Warehouse not found');
    const search = (query.search ?? '').trim().toLowerCase();
    const family = query.categoryId ? withDescendants(org, Number(query.categoryId)) : null;
    const includeZero = query.includeZero === 'true';
    const page = Math.max(1, Number(query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 25)));

    const items = productsOf(org)
      .map((row) => ({ row, onHand: stockByWarehouse(org, row.id).get(warehouse.id) ?? 0 }))
      .filter(({ row, onHand }) =>
        onHand !== 0
          ? true
          : includeZero && row.isActive && enabledWarehouses(org, row.id).includes(warehouse.id),
      )
      .filter(({ row }) => !family || family.has(row.categoryId))
      .filter(
        ({ row }) =>
          !search ||
          row.sku.toLowerCase().includes(search) ||
          row.name.toLowerCase().includes(search),
      )
      .sort((a, b) => a.row.name.localeCompare(b.row.name, 'es'));

    return {
      status: 200,
      data: {
        items: items.slice((page - 1) * pageSize, page * pageSize).map(({ row, onHand }) => ({
          product: stockProduct(org, row),
          onHand,
          reserved: reservedOf(org, row.id, warehouse.id),
          available: Number((onHand - reservedOf(org, row.id, warehouse.id)).toFixed(4)),
        })),
        total: items.length,
        page,
        pageSize,
      },
    };
  },

  'GET /products/:id/stock': ({ params, query }) => {
    const auth = authorize('stock.read');
    if (auth.error) return auth.error;
    const org = auth.user.organization_id;
    const warehouse = readableWarehouse(org, query.warehouseId);
    if (!warehouse) return error(404, 'WAREHOUSE_NOT_FOUND', 'Warehouse not found');
    const product = findProductRow(org, Number(params.id));
    if (!product) return error(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    const location = { id: warehouse.defaultLocationId, code: 'DEFAULT' };
    const total = stockByWarehouse(org, product.id).get(warehouse.id) ?? 0;
    const reserved = reservedOf(org, product.id, warehouse.id);
    const loose = onHand(org, product.id, warehouse.id, null);
    const balances = [
      ...(loose !== 0 ? [{ location, lot: null, onHand: loose }] : []),
      ...lotsInWarehouse(org, product.id, warehouse.id).map((lot) => ({
        location,
        lot: {
          id: numericId(`${product.id}:${lot.code}`),
          code: lot.code,
          manufactureDate: lot.manufactureDate,
          expiryDate: lot.expiryDate,
        },
        onHand: lot.onHand,
      })),
    ];
    return {
      status: 200,
      data: {
        product: stockProduct(org, product),
        warehouse: { id: warehouse.id, code: warehouse.code, name: warehouse.name },
        onHand: total,
        reserved,
        available: Number((total - reserved).toFixed(4)),
        balances,
      },
    };
  },

  'GET /products/:id/lots': ({ params, query }) => {
    const auth = authorize('stock.read');
    if (auth.error) return auth.error;
    const org = auth.user.organization_id;
    const warehouse = readableWarehouse(org, query.warehouseId);
    if (!warehouse) return error(404, 'WAREHOUSE_NOT_FOUND', 'Warehouse not found');
    const product = findProductRow(org, Number(params.id));
    if (!product) return error(404, 'PRODUCT_NOT_FOUND', 'Product not found');
    if (!product.tracksLots) return { status: 200, data: [] };
    const location = { id: warehouse.defaultLocationId, code: 'DEFAULT' };
    return {
      status: 200,
      data: lotsInWarehouse(org, product.id, warehouse.id).map((lot) => ({
        id: numericId(`${product.id}:${lot.code}`),
        code: lot.code,
        manufactureDate: lot.manufactureDate,
        expiryDate: lot.expiryDate,
        onHand: lot.onHand,
        locations: [{ location, onHand: lot.onHand }],
      })),
    };
  },

  'PATCH /products/:id/lots/:lotId': ({ params, body }) => {
    const auth = authorize('product.manage');
    if (auth.error) return auth.error;
    const org = auth.user.organization_id;
    const product = findProductRow(org, Number(params.id));
    const code = product
      ? lotsOf(org, product.id).find(
          (lot) => numericId(`${product.id}:${lot}`) === Number(params.lotId),
        )
      : undefined;
    if (!product || code === undefined) return error(404, 'LOT_NOT_FOUND', 'Lot not found');

    const input = (body ?? {}) as { manufactureDate?: unknown; expiryDate?: unknown };
    const current = lotDatesOf(org, product.id, code);
    const next = { ...current };
    for (const field of ['manufactureDate', 'expiryDate'] as const) {
      const value = input[field];
      if (value === undefined) continue;
      if (
        value !== null &&
        (typeof value !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
          Number.isNaN(Date.parse(value)))
      ) {
        return error(400, 'VALIDATION', `${field} must be a valid ISO 8601 date string`);
      }
      next[field] = value;
    }
    if (next.manufactureDate && next.expiryDate && next.expiryDate < next.manufactureDate) {
      return error(
        400,
        'LOT_DATES_INVALID',
        'The expiry date cannot be before the manufacture date',
      );
    }
    setLotDates(org, product.id, code, next);
    return { status: 200, data: { id: Number(params.lotId), code, ...next } };
  },
};
