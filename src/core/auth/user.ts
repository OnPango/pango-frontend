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
  'user.read': 'WAREHOUSE',
  'user.manage': 'WAREHOUSE',
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
  'movement.import': 'WAREHOUSE',
  'inventory.import': 'WAREHOUSE',
  'stock_request.read': 'WAREHOUSE',
  'stock_request.create': 'WAREHOUSE',
  'stock_request.approve': 'WAREHOUSE',
  'forecast.read': 'WAREHOUSE',
  'alert.read': 'WAREHOUSE',
  'alert.resolve': 'WAREHOUSE',
} as const satisfies Record<string, PermissionScope>;

export type Permission = keyof typeof PERMISSION_SCOPES;

export const PERMISSIONS = Object.keys(PERMISSION_SCOPES) as Permission[];

/** A role granted to the user, on one warehouse or on all of them (`warehouse` null). */
export type RoleGrant = {
  id: string;
  name: string;
  isSystem: boolean;
  warehouse: { id: string; name: string } | null;
  permissions: Permission[];
};

/** The signed-in person inside the organization the session belongs to. */
export type User = {
  /** Id of the user inside the organization (not the account id). */
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  organization: { id: string; subdomain: string; legalName: string };
  roles: RoleGrant[];
  /**
   * Union of the permissions of every role, whatever its warehouse. Only for showing or hiding UI:
   * the backend decides, per warehouse, what is actually allowed.
   */
  permissions: Permission[];
};
