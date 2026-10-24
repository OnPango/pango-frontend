export type Permission =
  | 'dashboard:view'
  | 'movements:view'
  | 'users:manage'
  | 'areas:manage'
  | 'products:manage'
  | 'warehouses:manage'
  | 'inventory:record'
  | 'requests:create'
  | 'requests:attend'
  | 'suppliers:manage'
  | 'forecast:view'
  | 'alerts:view'
  | 'movements:import-history';

export type User = {
  id: string;
  name: string;
  email: string;
  roleName: string;
  areaId: string;
  organizationId: string;
  permissions: Permission[];
};
