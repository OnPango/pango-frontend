/**
 * Where a permission is granted, as in the backend's `permissions` table:
 * - `ORGANIZATION`: applies to the whole organization.
 * - `WAREHOUSE`: exercised on a specific warehouse.
 */
export type PermissionScope = 'ORGANIZATION' | 'WAREHOUSE';

/**
 * Every permission the frontend knows, with its scope. Mirrors the backend's `permissions` table
 * (`code` and `scope`); codes are `resource.action`. Used at runtime to discard unknown values
 * coming from the API.
 */
export const PERMISSION_SCOPES = {
  'user.read': 'ORGANIZATION',
  'user.manage': 'ORGANIZATION',
  'role.read': 'ORGANIZATION',
  'role.manage': 'ORGANIZATION',
  'department.manage': 'ORGANIZATION',
  'settings.manage': 'ORGANIZATION',
  'warehouse.manage': 'ORGANIZATION',
  'catalog.read': 'ORGANIZATION',
  'product.manage': 'ORGANIZATION',
  'category.manage': 'ORGANIZATION',
  'attribute.manage': 'ORGANIZATION',
  'supplier.manage': 'ORGANIZATION',
  'movement_type.manage': 'ORGANIZATION',
  'forecast.run': 'ORGANIZATION',
  'notification.manage': 'ORGANIZATION',
  'warehouse.read': 'WAREHOUSE',
  'location.manage': 'WAREHOUSE',
  'stock.read': 'WAREHOUSE',
  'replenishment.manage': 'WAREHOUSE',
  'movement.read': 'WAREHOUSE',
  'movement.create': 'WAREHOUSE',
  'movement.confirm': 'WAREHOUSE',
  'movement.receive': 'WAREHOUSE',
  'movement.void': 'WAREHOUSE',
  'stock_request.read': 'WAREHOUSE',
  'stock_request.create': 'WAREHOUSE',
  'stock_request.approve': 'WAREHOUSE',
  'forecast.read': 'WAREHOUSE',
  'alert.read': 'WAREHOUSE',
  'alert.resolve': 'WAREHOUSE',
} as const satisfies Record<string, PermissionScope>;

export type Permission = keyof typeof PERMISSION_SCOPES;

export const PERMISSIONS = Object.keys(PERMISSION_SCOPES) as Permission[];

export type User = {
  id: string;
  name: string;
  email: string;
  roleName: string;
  areaId: string;
  organizationId: string;
  permissions: Permission[];
};
