import type { User, Permission } from '@/core/auth/user';

export function hasAnyPermission(user: User | null, anyOf: Permission[]): boolean {
  if (anyOf.length === 0) {
    return true;
  }
  return !!user && anyOf.some((p) => user.permissions.includes(p));
}

/**
 * Warehouses where a grant of the user holds `permission`: every one (a grant without warehouse,
 * like the Owner's) or the ids of their grants. Only for showing or hiding UI, as above.
 */
export function warehousesWithPermission(
  user: User | null,
  permission: Permission,
): 'all' | Set<string> {
  const grants = (user?.roles ?? []).filter((grant) => grant.permissions.includes(permission));
  if (grants.some((grant) => grant.warehouse === null)) return 'all';
  return new Set(grants.flatMap((grant) => (grant.warehouse ? [grant.warehouse.id] : [])));
}

/** Whether the user holds `permission` in the warehouse (on it, or on every warehouse). */
export function hasPermissionIn(
  user: User | null,
  permission: Permission,
  warehouseId: string,
): boolean {
  const warehouses = warehousesWithPermission(user, permission);
  return warehouses === 'all' || warehouses.has(warehouseId);
}
