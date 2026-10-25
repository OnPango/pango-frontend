import { PERMISSIONS, type Permission } from '@/core/auth/user';

/**
 * In-memory "database" for the mock backend. Shapes mimic the backend tables (snake_case),
 * not the frontend domain types.
 *
 * Every user has the password `Pango123*`.
 */

export interface RoleRow {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface UserRow {
  id: string;
  full_name: string;
  email: string;
  /** Plain text ONLY because this is a mock. A real backend stores a hash (bcrypt/argon2). */
  password: string;
  role_id: string;
  area_id: string;
  organization_id: string;
  is_active: boolean;
}

export const MOCK_PASSWORD = 'Pango123*';

export const roles: RoleRow[] = [
  { id: 'role-admin', name: 'Administrador', permissions: [...PERMISSIONS] },
  {
    id: 'role-warehouse',
    name: 'Almacenista',
    permissions: [
      'dashboard:view',
      'warehouses:manage',
      'inventory:record',
      'requests:attend',
      'movements:view',
      'alerts:view',
    ],
  },
  {
    id: 'role-purchasing',
    name: 'Compras',
    permissions: ['dashboard:view', 'suppliers:manage', 'forecast:view', 'alerts:view'],
  },
  {
    id: 'role-requester',
    name: 'Solicitante',
    permissions: ['dashboard:view', 'requests:create'],
  },
];

export const users: UserRow[] = [
  {
    id: 'usr-001',
    full_name: 'Carlos Arango',
    email: 'carlosarango1107@outlook.com',
    password: MOCK_PASSWORD,
    role_id: 'role-admin',
    area_id: 'area-admin',
    organization_id: 'org-pango',
    is_active: true,
  },
  {
    id: 'usr-002',
    full_name: 'Laura Gómez',
    email: 'laura.gomez@pango.co',
    password: MOCK_PASSWORD,
    role_id: 'role-warehouse',
    area_id: 'area-logistics',
    organization_id: 'org-pango',
    is_active: true,
  },
  {
    id: 'usr-003',
    full_name: 'Paula Torres',
    email: 'paula.torres@pango.co',
    password: MOCK_PASSWORD,
    role_id: 'role-purchasing',
    area_id: 'area-purchasing',
    organization_id: 'org-pango',
    is_active: true,
  },
  {
    id: 'usr-004',
    full_name: 'Andrés Ruiz',
    email: 'andres.ruiz@pango.co',
    password: MOCK_PASSWORD,
    role_id: 'role-requester',
    area_id: 'area-production',
    organization_id: 'org-pango',
    is_active: true,
  },
  {
    id: 'usr-005',
    full_name: 'Mateo Díaz',
    email: 'mateo.diaz@pango.co',
    password: MOCK_PASSWORD,
    role_id: 'role-requester',
    area_id: 'area-production',
    organization_id: 'org-pango',
    is_active: false,
  },
];

export const findUserByEmail = (email: string) =>
  users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());

export const findUserById = (id: string) => users.find((user) => user.id === id);

export const findRoleById = (id: string) => roles.find((role) => role.id === id);
