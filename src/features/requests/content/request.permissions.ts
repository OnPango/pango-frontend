import type { User } from '@/core/auth/user';
import type { Option, StockRequest } from '../types/requests.types';

const grantsWith = (user: User | null, permission: string) =>
  (user?.roles ?? []).filter((grant) => (grant.permissions as string[]).includes(permission));

/**
 * Whether the user may attend (start, reject, fulfil) a request:
 * - `allowed`: they hold `stock_request.approve` in its warehouse (US-030) and did not create it;
 * - `requester`: they would, but they created it. Whoever asks does not attend their own request
 *   (separation of duties): someone else in the warehouse does;
 * - `denied`: no `stock_request.approve` in its warehouse.
 */
export type Attendance = 'allowed' | 'requester' | 'denied';

export function attendance(
  user: User | null,
  request: Pick<StockRequest, 'warehouse' | 'requestedBy'>,
): Attendance {
  const approves = grantsWith(user, 'stock_request.approve').some(
    (grant) => grant.warehouse === null || grant.warehouse.id === request.warehouse.id,
  );
  if (!approves) return 'denied';
  return request.requestedBy.id === user?.id ? 'requester' : 'allowed';
}

/**
 * Where the user attends requests: every warehouse (a grant without warehouse, the Owner), the
 * warehouses of their grants, or none.
 */
export function attendedWarehouses(user: User | null): 'all' | Option[] {
  const grants = grantsWith(user, 'stock_request.approve');
  if (grants.some((grant) => grant.warehouse === null)) return 'all';
  const byId = new Map<string, Option>();
  for (const grant of grants) if (grant.warehouse) byId.set(grant.warehouse.id, grant.warehouse);
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
}
