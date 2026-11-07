import { PERMISSIONS, type Permission } from '@/core/auth/user';

/**
 * Permissions that only make sense together: to act on something you must be able to see it. The
 * backend does not enforce this; the editor does, so a role is never left with "resolve alerts" but
 * without "view alerts". Key = needs value.
 */
export const PERMISSION_DEPENDENCIES: Partial<Record<Permission, Permission>> = {
  'user.manage': 'user.read',
  'role.manage': 'role.read',
  'warehouse.manage': 'warehouse.read',
  'product.manage': 'catalog.read',
  'category.manage': 'catalog.read',
  'attribute.manage': 'catalog.read',
  'supplier.manage': 'catalog.read',
  'location.manage': 'warehouse.read',
  'replenishment.manage': 'stock.read',
  'movement.create': 'movement.read',
  'movement.confirm': 'movement.read',
  'movement.receive': 'movement.read',
  'movement.void': 'movement.read',
  'stock_request.create': 'stock_request.read',
  'stock_request.approve': 'stock_request.read',
  'forecast.run': 'forecast.read',
  'alert.resolve': 'alert.read',
};

const inCatalogOrder = (granted: ReadonlySet<Permission>) =>
  PERMISSIONS.filter((permission) => granted.has(permission));

/** `current` plus `permission` and, if needed, the one it depends on. */
export function withPermission(
  current: readonly Permission[],
  permission: Permission,
): Permission[] {
  const next = new Set(current);
  next.add(permission);
  const needed = PERMISSION_DEPENDENCIES[permission];
  if (needed) next.add(needed);
  return inCatalogOrder(next);
}

/** `current` without `permission` and without everything that depends on it. */
export function withoutPermission(
  current: readonly Permission[],
  permission: Permission,
): Permission[] {
  const next = new Set(current);
  next.delete(permission);
  for (const [dependent, needed] of Object.entries(PERMISSION_DEPENDENCIES)) {
    if (needed === permission) next.delete(dependent as Permission);
  }
  return inCatalogOrder(next);
}

/** Same permissions, whatever the order. */
export function samePermissions(a: readonly Permission[], b: readonly Permission[]): boolean {
  return a.length === b.length && a.every((permission) => b.includes(permission));
}
