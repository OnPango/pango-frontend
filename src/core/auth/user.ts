/** Every permission the frontend knows about. Used at runtime to discard unknown values from the API. */
export const PERMISSIONS = [
  'dashboard:view',
  'movements:view',
  'users:manage',
  'areas:manage',
  'products:manage',
  'warehouses:manage',
  'inventory:record',
  'requests:create',
  'requests:attend',
  'suppliers:manage',
  'forecast:view',
  'alerts:view',
  'movements:import-history',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type User = {
  id: string;
  name: string;
  email: string;
  roleName: string;
  areaId: string;
  organizationId: string;
  permissions: Permission[];
};
