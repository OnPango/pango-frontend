import type { User, Permission } from '@/core/auth/user';

export function hasAnyPermission(user: User | null, anyOf: Permission[]): boolean {
  if (anyOf.length === 0) {
    return true;
  }
  return !!user && anyOf.some((p) => user.permissions.includes(p));
}
