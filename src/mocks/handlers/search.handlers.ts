import { users } from '../db';
import { authenticate, error } from '../guard';
import { numericId } from '../ids';
import type { MockRoutes } from '../server';
import { alerts } from '../stock';
import { categoriesOf, findCategoryRow, findProductRow, productsOf } from './catalog.handlers';
import { activeWarehousesOf, findWarehouseRow } from './warehouses.handlers';

/**
 * `GET /search` of pango-core (`docs/search.md`): a few matches per group with their totals, and
 * `null` for a group the user cannot read. The mock has one role per user and no warehouse scope.
 */

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'es');

function group<T>(list: T[], limit: number) {
  return { items: list.slice(0, limit), total: list.length };
}

export const searchRoutes: MockRoutes = {
  'GET /search': ({ query }) => {
    const auth = authenticate();
    if (auth.error) return auth.error;
    const text = (query.q ?? '').trim();
    if (text.length < 2 || text.length > 100) {
      return error(400, 'VALIDATION_ERROR', 'q must be between 2 and 100 characters');
    }
    const limit = Math.min(10, Math.max(1, Number(query.limit ?? 5)));
    const org = auth.user.organization_id;
    const can = (permission: string) =>
      auth.role?.permissions.includes(permission as never) ?? false;
    const has = (...values: (string | null | undefined)[]) =>
      values.some((value) => value?.toLowerCase().includes(text.toLowerCase()));

    const products = can('catalog.read')
      ? group(
          productsOf(org)
            .filter((row) => row.isActive && has(row.sku, row.name))
            .sort(byName)
            .map((row) => ({
              id: row.id,
              sku: row.sku,
              name: row.name,
              category: findCategoryRow(org, row.categoryId)?.name ?? '',
            })),
          limit,
        )
      : null;

    const categories = can('catalog.read')
      ? group(
          categoriesOf(org)
            .filter((row) => has(row.name))
            .sort((a, b) => Number(b.isActive) - Number(a.isActive) || byName(a, b))
            .map((row) => ({
              id: row.id,
              name: row.name,
              parent: row.parentId ? (findCategoryRow(org, row.parentId)?.name ?? null) : null,
              isActive: row.isActive,
            })),
          limit,
        )
      : null;

    const warehouses = group(
      can('warehouse.read') || can('warehouse.manage')
        ? activeWarehousesOf(org)
            .filter((row) => has(row.code, row.name))
            .sort(byName)
            .map((row) => ({ id: row.id, code: row.code, name: row.name, type: row.type }))
        : [],
      limit,
    );

    const alertGroup = can('alert.read')
      ? group(
          alerts
            .filter((row) => row.org === org && row.status === 'OPEN')
            .map((row) => ({
              row,
              product: findProductRow(org, row.productId)!,
              warehouse: findWarehouseRow(org, row.warehouseId)!,
            }))
            .filter(({ product, warehouse }) =>
              has(product.sku, product.name, warehouse.code, warehouse.name),
            )
            .sort((a, b) => b.row.severity - a.row.severity)
            .map(({ row, product, warehouse }) => ({
              id: row.id,
              severity: row.severity,
              product: { id: product.id, sku: product.sku, name: product.name },
              warehouse: { id: warehouse.id, name: warehouse.name },
            })),
          limit,
        )
      : null;

    const userGroup = can('user.read')
      ? group(
          users
            .filter((user) => user.organization_id === org && has(user.full_name, user.email))
            .sort(
              (a, b) =>
                Number(b.is_active) - Number(a.is_active) ||
                a.full_name.localeCompare(b.full_name, 'es'),
            )
            .map((user) => ({
              id: numericId(user.id),
              name: user.full_name,
              email: user.email,
              jobTitle: user.job_title ?? null,
              isActive: user.is_active,
            })),
          limit,
        )
      : null;

    return {
      status: 200,
      data: {
        query: text,
        products,
        categories,
        warehouses,
        alerts: alertGroup,
        users: userGroup,
      },
    };
  },
};
