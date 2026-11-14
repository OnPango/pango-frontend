import type { User } from '@/core/auth/user';
import type { Option } from '../types/movements.types';

/**
 * Warehouses whose movements the user reads (`movement.read` is per warehouse): every one (a grant
 * without warehouse, the Owner) or those of their grants.
 */
export function historyWarehouses(user: User | null): 'all' | Option[] {
  const grants = (user?.roles ?? []).filter((grant) =>
    (grant.permissions as string[]).includes('movement.read'),
  );
  if (grants.some((grant) => grant.warehouse === null)) return 'all';
  const byId = new Map<string, Option>();
  for (const grant of grants) if (grant.warehouse) byId.set(grant.warehouse.id, grant.warehouse);
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
