import type { User } from '@/core/auth/user';
import type { Option } from '../types/alerts.types';

const grantsWith = (user: User | null, permission: string) =>
  (user?.roles ?? []).filter((grant) => (grant.permissions as string[]).includes(permission));

/**
 * Warehouses whose alerts the user reads (`alert.read` is per warehouse): every one (a grant
 * without warehouse, the Owner) or those of their grants.
 */
export function alertWarehouses(user: User | null): 'all' | Option[] {
  const grants = grantsWith(user, 'alert.read');
  if (grants.some((grant) => grant.warehouse === null)) return 'all';
  const byId = new Map<string, Option>();
  for (const grant of grants) if (grant.warehouse) byId.set(grant.warehouse.id, grant.warehouse);
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

/** Whether the user may mark the alerts of a warehouse attended or pending (`alert.resolve`). */
export function resolvesAlertsIn(user: User | null, warehouseId: string): boolean {
  return grantsWith(user, 'alert.resolve').some(
    (grant) => grant.warehouse === null || grant.warehouse.id === warehouseId,
  );
}

/** Whether the user may read the stock (and so the current situation) in a warehouse. */
export function readsStockIn(user: User | null, warehouseId: string): boolean {
  return grantsWith(user, 'stock.read').some(
    (grant) => grant.warehouse === null || grant.warehouse.id === warehouseId,
  );
}
