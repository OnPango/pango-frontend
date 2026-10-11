export type Permission =
  | 'users:manage'
  | 'areas:manage'
  | 'products:manage'
  | 'warehouses:manage'
  | 'inventory:record'
  | 'requests:create'
  | 'requests:attend'
  | 'suppliers:manage'
  | 'forecast:view'
  | 'alerts:view';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  roleName: string;
  areaId: string;
  organizationId: string;
  permissions: Permission[];
}

export function hasAnyPermission(user: SessionUser | null, anyOf: Permission[]): boolean {
  return !!user && anyOf.some((p) => user.permissions.includes(p));
}
