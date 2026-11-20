import type { Permission } from '@/core/auth/user';
import { findRoleById, findUserById } from './db';
import { requestContext } from './server';
import { readAccessCookie } from './session';

/** An error body as pango-core sends it: `{ statusCode, code, message }`. */
export const error = (status: number, code: string, message: string) => ({
  status,
  data: { statusCode: status, code, message },
});

export const tenantOf = () => requestContext.headers['x-tenant']?.trim().toLowerCase() || null;

/** Session + permission check, like the backend's guard: 401 without a valid session, 403 without one of `anyOf`. */
export function authorize(...anyOf: Permission[]) {
  const session = readAccessCookie(tenantOf());
  if (!session) {
    return { error: error(401, 'UNAUTHENTICATED', 'Missing, invalid or expired access token') };
  }
  const user = findUserById(session.sub);
  if (!user || !user.is_active) {
    return { error: error(401, 'UNAUTHENTICATED', 'User not found or inactive') };
  }
  const role = findRoleById(user.role_id);
  if (!role || !anyOf.some((permission) => role.permissions.includes(permission))) {
    return { error: error(403, 'FORBIDDEN', 'You do not have permission for this operation') };
  }
  return { user, role };
}

/** Session only, for endpoints any signed-in user may call (`GET /departments`). */
export function authenticate() {
  const session = readAccessCookie(tenantOf());
  if (!session) {
    return { error: error(401, 'UNAUTHENTICATED', 'Missing, invalid or expired access token') };
  }
  const user = findUserById(session.sub);
  if (!user || !user.is_active) {
    return { error: error(401, 'UNAUTHENTICATED', 'User not found or inactive') };
  }
  return { user, role: findRoleById(user.role_id) };
}
