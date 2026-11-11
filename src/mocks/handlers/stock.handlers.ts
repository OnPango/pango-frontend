import { authorize, error } from '../guard';
import { numericId } from '../ids';
import type { MockRoutes } from '../server';
import { enabledWarehouses, lotsInWarehouse, stockByWarehouse } from '../stock';
import {
  findCategoryRow,
  findProductRow,
  findUnitRow,
  productsOf,
  withDescendants,
} from './catalog.handlers';
import { findWarehouseRow } from './warehouses.handlers';

/**
 * Stock queries of pango-core (`docs/stock.md`): a warehouse's stock and a product's lots in a
 * warehouse. The mock has no reservations (reserved is 0) and no lot dates.
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
          reserved: 0,
          available: onHand,
        })),
        total: items.length,
        page,
        pageSize,
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
        manufactureDate: null,
        expiryDate: null,
        onHand: lot.onHand,
        locations: [{ location, onHand: lot.onHand }],
      })),
    };
  },
};
