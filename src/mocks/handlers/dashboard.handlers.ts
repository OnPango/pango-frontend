import type { Permission } from '@/core/auth/user';
import { findUserById } from '../db';
import { authenticate, authorize } from '../guard';
import type { MockRoutes } from '../server';
import {
  alerts,
  availableOf,
  enabledWarehouses,
  lotsInWarehouse,
  replenishmentOf,
  stockByWarehouse,
} from '../stock';
import { categoriesOf, findUnitRow, productsOf } from './catalog.handlers';
import { movementsOf, movementTypeOf } from './movements.handlers';
import { requestsOf } from './stock-requests.handlers';
import { activeWarehousesOf, findWarehouseRow } from './warehouses.handlers';

/**
 * The dashboard of pango-core (`docs/dashboard.md`), computed from the other mocks. The mock has
 * one role per user and no warehouse scope, so a permission covers every warehouse. There is no
 * forecast here: days of cover are null, and excess only compares with the max stock.
 */

const DAY_MS = 86_400_000;
const LIST = 8;

type Org = string;

function positions(org: Org, warehouseId: number | null) {
  const warehouses = activeWarehousesOf(org).filter((w) => !warehouseId || w.id === warehouseId);
  const costs = averageCosts(org);
  return productsOf(org).flatMap((product) => {
    const stock = stockByWarehouse(org, product.id);
    const ids = new Set([...stock.keys(), ...enabledWarehouses(org, product.id)]);
    return warehouses
      .filter((w) => ids.has(w.id))
      .map((w) => ({
        product,
        unit: findUnitRow(product.stockUnitId)?.code ?? '',
        warehouse: w,
        onHand: stock.get(w.id) ?? 0,
        available: availableOf(org, product.id, w.id),
        cost: costs.get(product.id) ?? 0,
        maxStock: replenishmentOf(org, product.id, w.id).maxStock,
      }));
  });
}

/** The last inbound unit cost of each product: the mock keeps no average cost. */
function averageCosts(org: Org) {
  const costs = new Map<number, number>();
  for (const movement of movementsOf(org)) {
    for (const line of movement.lines) {
      if (!line.removes && line.unitCost > 0) costs.set(line.productId, line.unitCost);
    }
  }
  return costs;
}

const productRef = (product: { id: number; sku: string; name: string }, unit: string) => ({
  id: product.id,
  sku: product.sku,
  name: product.name,
  unit,
});

function inWarehouse(
  movement: { warehouseId: number; destinationWarehouseId: number | null },
  warehouseId: number | null,
) {
  return (
    !warehouseId ||
    movement.warehouseId === warehouseId ||
    movement.destinationWarehouseId === warehouseId
  );
}

/** What entered (+) or left (−) a product's stock in a warehouse after `since`. */
function netSince(org: Org, productId: number, warehouseId: number, since: Date) {
  let net = 0;
  for (const m of movementsOf(org)) {
    if (new Date(m.occurredAt) <= since) continue;
    for (const line of m.lines) {
      if (line.productId !== productId) continue;
      if (line.removes && m.warehouseId === warehouseId) net -= line.quantity;
      const target = m.destinationWarehouseId ?? m.warehouseId;
      if (!line.removes && target === warehouseId) net += line.quantity;
      if (line.removes && m.destinationWarehouseId === warehouseId && m.status === 'CONFIRMED') {
        net += line.receivedQuantity ?? line.quantity;
      }
    }
  }
  return net;
}

/** Each product counts once, whatever warehouses its alerts are in. */
const distinctProducts = (rows: { productId: number }[]) =>
  new Set(rows.map((row) => row.productId)).size;

const dayOf = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const dashboardRoutes: MockRoutes = {
  'GET /dashboard/summary': ({ query }) => {
    const auth = authenticate();
    if (auth.error) return auth.error;
    const org = auth.user.organization_id;
    const can = (permission: Permission) => auth.role?.permissions.includes(permission) ?? false;
    const warehouseId = query.warehouseId ? Number(query.warehouseId) : null;

    const stock = can('stock.read') ? positions(org, warehouseId) : null;
    const inForce = alerts.filter(
      (a) =>
        a.org === org &&
        (a.status === 'OPEN' || a.status === 'ATTENDED') &&
        (!warehouseId || a.warehouseId === warehouseId),
    );
    const moves = movementsOf(org).filter((m) => inWarehouse(m, warehouseId));
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const mine = alerts.filter(
      (a) => a.org === org && (!warehouseId || a.warehouseId === warehouseId),
    );
    const activeProducts = productsOf(org).filter((p) => p.isActive);
    const requests = requestsOf(org).filter((r) => !warehouseId || r.warehouseId === warehouseId);

    return {
      status: 200,
      data: {
        currency: 'COP',
        comparedTo: monthAgo.toISOString(),
        kpis: {
          products: can('catalog.read')
            ? {
                current: activeProducts.length,
                previous: activeProducts.filter((p) => new Date(p.createdAt) <= monthAgo).length,
              }
            : null,
          stockValue: stock
            ? {
                current: stock.reduce((sum, p) => sum + Math.max(p.onHand, 0) * p.cost, 0),
                previous: stock.reduce(
                  (sum, p) =>
                    sum +
                    Math.max(p.onHand - netSince(org, p.product.id, p.warehouse.id, monthAgo), 0) *
                      p.cost,
                  0,
                ),
              }
            : null,
          lowStock: can('alert.read')
            ? {
                current: distinctProducts(inForce),
                critical: distinctProducts(inForce.filter((a) => a.severity === 3)),
                previous: distinctProducts(
                  mine.filter(
                    (a) =>
                      new Date(a.createdAt) <= monthAgo &&
                      (!a.resolvedAt || new Date(a.resolvedAt) > monthAgo),
                  ),
                ),
              }
            : null,
          pendingRequests: can('stock_request.read')
            ? {
                current: requests.filter(
                  (r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS',
                ).length,
                pending: requests.filter((r) => r.status === 'PENDING').length,
                inProgress: requests.filter((r) => r.status === 'IN_PROGRESS').length,
                previous: requests.filter((r) => {
                  if (new Date(r.createdAt) > monthAgo) return false;
                  const closed = r.events.find((e) =>
                    ['FULFILLED', 'REJECTED', 'CANCELLED'].includes(e.status),
                  );
                  return !closed || new Date(closed.createdAt) > monthAgo;
                }).length,
              }
            : null,
        },
        lowStockItems: can('alert.read')
          ? {
              total: inForce.length,
              items: [...inForce]
                .sort((a, b) => b.severity - a.severity || b.updatedAt.localeCompare(a.updatedAt))
                .slice(0, LIST)
                .map((a) => {
                  const product = productsOf(org).find((p) => p.id === a.productId)!;
                  return {
                    alertId: a.id,
                    severity: a.severity,
                    status: a.status,
                    product: productRef(product, findUnitRow(product.stockUnitId)?.code ?? ''),
                    warehouse: {
                      id: a.warehouseId,
                      name: findWarehouseRow(org, a.warehouseId)?.name ?? '',
                    },
                    available: a.availableQuantity,
                    reorderPoint: a.reorderPoint,
                    suggested: a.suggestedQuantity,
                    daysOfCover: null,
                  };
                }),
            }
          : null,
        recentActivity: can('movement.read')
          ? [...moves]
              .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.id - a.id)
              .slice(0, LIST)
              .map((m) => {
                const type = movementTypeOf(m.typeId);
                const first = productsOf(org).find((p) => p.id === m.lines[0]?.productId);
                const ref = (id: number) => ({ id, name: findWarehouseRow(org, id)?.name ?? '' });
                return {
                  id: m.id,
                  number: m.number,
                  status: m.status,
                  type: type?.name ?? '',
                  nature: type?.nature ?? 'ADJUSTMENT',
                  occurredAt: m.occurredAt,
                  warehouse: ref(m.warehouseId),
                  destinationWarehouse:
                    m.destinationWarehouseId !== null ? ref(m.destinationWarehouseId) : null,
                  firstProduct: first?.name ?? '',
                  firstSku: first?.sku ?? '',
                  lineCount: m.lines.length,
                  registeredBy: findUserById(m.userId)?.full_name ?? '',
                };
              })
          : null,
      },
    };
  },

  'GET /dashboard/inventory-level': ({ query }) => {
    const auth = authorize('stock.read');
    if (auth.error) return auth.error;
    const org = auth.user.organization_id;
    const warehouseId = query.warehouseId ? Number(query.warehouseId) : null;
    const days = [7, 30, 90].includes(Number(query.days)) ? Number(query.days) : 7;
    const can = (permission: Permission) => auth.role?.permissions.includes(permission) ?? false;
    const stock = positions(org, warehouseId);
    const weekly = days > 30;
    const count = weekly ? 13 : days;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const points = Array.from({ length: count }, (_, i) => {
      const back = count - 1 - i;
      const end = new Date(today);
      const start = new Date(today);
      if (weekly) {
        const monday = new Date(today);
        monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) - back * 7);
        start.setTime(monday.getTime());
        end.setTime(Math.min(monday.getTime() + 6 * DAY_MS, today.getTime()));
      } else {
        end.setDate(end.getDate() - back);
        start.setTime(end.getTime());
      }
      const endOfDay = new Date(end.getTime() + DAY_MS - 1);
      const low = new Set(
        alerts
          .filter(
            (a) =>
              a.org === org &&
              (!warehouseId || a.warehouseId === warehouseId) &&
              new Date(a.createdAt) <= endOfDay &&
              (!a.resolvedAt || new Date(a.resolvedAt) > endOfDay),
          )
          .map((a) => a.productId),
      );
      const withStock = new Set(
        stock
          .filter((p) => p.onHand - netSince(org, p.product.id, p.warehouse.id, endOfDay) > 0)
          .map((p) => p.product.id),
      );
      const inStock = [...withStock].filter((id) => !low.has(id)).length;
      return {
        start: dayOf(start),
        end: dayOf(end),
        inStock,
        lowStock: can('alert.read') ? low.size : null,
      };
    });
    return {
      status: 200,
      data: { days, granularity: weekly ? 'WEEK' : 'DAY', points },
    };
  },

  'GET /dashboard/inventory': ({ query }) => {
    const auth = authorize('stock.read');
    if (auth.error) return auth.error;
    const org = auth.user.organization_id;
    const warehouseId = query.warehouseId ? Number(query.warehouseId) : null;
    const stock = positions(org, warehouseId).filter((p) => p.onHand > 0);
    const categories = categoriesOf(org);
    const rootOf = (id: number): number => {
      const category = categories.find((c) => c.id === id);
      return category?.parentId ? rootOf(category.parentId) : id;
    };
    const value = (p: (typeof stock)[number]) => Math.max(p.onHand, 0) * p.cost;

    const families = new Map<number, { value: number; items: number }>();
    for (const p of stock) {
      const root = rootOf(p.product.categoryId);
      const entry = families.get(root) ?? { value: 0, items: 0 };
      entry.value += value(p);
      entry.items += 1;
      families.set(root, entry);
    }

    const excess = stock
      .filter((p) => p.maxStock !== null && p.available > p.maxStock)
      .map((p) => ({
        product: productRef(p.product, p.unit),
        warehouse: { id: p.warehouse.id, name: p.warehouse.name },
        available: p.available,
        limit: p.maxStock!,
        limitSource: 'MAX_STOCK',
        excess: p.available - p.maxStock!,
        value: (p.available - p.maxStock!) * p.cost,
      }))
      .sort((a, b) => b.value - a.value);

    const today = new Date().toISOString().slice(0, 10);
    const limit = new Date(Date.now() + 30 * DAY_MS).toISOString().slice(0, 10);
    const lots = stock
      .flatMap((p) =>
        lotsInWarehouse(org, p.product.id, p.warehouse.id)
          .filter((lot) => lot.onHand > 0 && lot.expiryDate && lot.expiryDate <= limit)
          .map((lot) => ({
            product: productRef(p.product, p.unit),
            warehouse: { id: p.warehouse.id, name: p.warehouse.name },
            lot: lot.code,
            expiryDate: lot.expiryDate!,
            onHand: lot.onHand,
            expired: lot.expiryDate! < today,
          })),
      )
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

    return {
      status: 200,
      data: {
        currency: 'COP',
        value: {
          total: stock.reduce((sum, p) => sum + value(p), 0),
          byFamily: [...families.entries()]
            .map(([familyId, entry]) => ({
              familyId,
              name: categories.find((c) => c.id === familyId)?.name ?? '',
              ...entry,
            }))
            .sort((a, b) => b.value - a.value),
        },
        excess: {
          items: excess.slice(0, 10),
          total: excess.length,
          value: excess.reduce((sum, e) => sum + e.value, 0),
        },
        // The mock's stock is seeded today: nothing has been still for 90 days.
        idle: { days: 90, items: [], total: 0, value: 0 },
        expiringLots: { days: 30, items: lots.slice(0, 10), total: lots.length },
      },
    };
  },

  'GET /dashboard/alerts': ({ query }) => {
    const auth = authorize('alert.read');
    if (auth.error) return auth.error;
    const org = auth.user.organization_id;
    const warehouseId = query.warehouseId ? Number(query.warehouseId) : null;
    const count = Math.min(12, Math.max(1, Number(query.months ?? 6)));
    const mine = alerts.filter(
      (a) => a.org === org && (!warehouseId || a.warehouseId === warehouseId),
    );

    const bySeverity = new Map<number, { critical: number; high: number; medium: number }>();
    for (const a of mine.filter((x) => x.status === 'OPEN' || x.status === 'ATTENDED')) {
      const entry = bySeverity.get(a.warehouseId) ?? { critical: 0, high: 0, medium: 0 };
      if (a.severity === 3) entry.critical += 1;
      else if (a.severity === 2) entry.high += 1;
      else entry.medium += 1;
      bySeverity.set(a.warehouseId, entry);
    }

    const now = new Date();
    const months = Array.from({ length: count }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
    const monthOf = (iso: string | null) => (iso ? iso.slice(0, 7) : null);
    return {
      status: 200,
      data: {
        bySeverity: [...bySeverity.entries()].map(([id, entry]) => ({
          warehouse: { id, name: findWarehouseRow(org, id)?.name ?? '' },
          ...entry,
        })),
        monthly: months.map((month) => ({
          month,
          created: mine.filter((a) => monthOf(a.createdAt) === month).length,
          attended: mine.filter((a) => monthOf(a.attendedAt) === month).length,
          resolved: mine.filter((a) => monthOf(a.resolvedAt) === month).length,
        })),
      },
    };
  },
};
