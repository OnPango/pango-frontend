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
  description?: string;
  permissions: Permission[];
}

export interface AreaRow {
  id: string;
  name: string;
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
  last_login_at: string | null;
  created_at: string;
}

export const MOCK_PASSWORD = 'Pango123*';

const USERS_STORAGE_KEY = 'pango_mock_db_users';
const ROLES_STORAGE_KEY = 'pango_mock_db_roles';
const AREAS_STORAGE_KEY = 'pango_mock_db_areas';

function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  if (typeof window === 'undefined' || !window.localStorage) return [...fallback];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [...fallback];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as T[]) : [...fallback];
  } catch {
    return [...fallback];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('[mock-db] Error guardando en localStorage:', err);
  }
}

const INITIAL_AREAS: AreaRow[] = [
  { id: 'area-admin', name: 'Administración' },
  { id: 'area-warehouse', name: 'Almacén' },
  { id: 'area-purchasing', name: 'Compra' },
  { id: 'area-consultant', name: 'Analista/Consultor' },
];

const INITIAL_ROLES: RoleRow[] = [
  {
    id: 'role-admin',
    name: 'Administrador',
    description: 'Acceso total y configuración del sistema',
    permissions: [...PERMISSIONS],
  },
  {
    id: 'role-warehouse',
    name: 'Almacenista',
    description: 'Gestión física y registros de inventario y almacenes',
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
    description: 'Gestión de proveedores, compras y proyecciones',
    permissions: ['dashboard:view', 'suppliers:manage', 'forecast:view', 'alerts:view'],
  },
  {
    id: 'role-requester',
    name: 'Solicitante',
    description: 'Creación y seguimiento de solicitudes de materiales',
    permissions: ['dashboard:view', 'requests:create'],
  },
];

const INITIAL_USERS: UserRow[] = [
  {
    id: 'usr-001',
    full_name: 'Carlos Arango',
    email: 'carlosarango1107@outlook.com',
    password: MOCK_PASSWORD,
    role_id: 'role-admin',
    area_id: 'area-admin',
    organization_id: 'org-pango',
    is_active: true,
    last_login_at: '2026-10-25T14:20:00Z',
    created_at: '2026-09-01T08:00:00Z',
  },
  {
    id: 'usr-002',
    full_name: 'Laura Gómez',
    email: 'laura.gomez@pango.co',
    password: MOCK_PASSWORD,
    role_id: 'role-warehouse',
    area_id: 'area-warehouse',
    organization_id: 'org-pango',
    is_active: true,
    last_login_at: '2026-10-25T11:45:00Z',
    created_at: '2026-09-10T09:30:00Z',
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
    last_login_at: '2026-10-24T16:10:00Z',
    created_at: '2026-09-15T14:00:00Z',
  },
  {
    id: 'usr-004',
    full_name: 'Andrés Ruiz',
    email: 'andres.ruiz@pango.co',
    password: MOCK_PASSWORD,
    role_id: 'role-requester',
    area_id: 'area-consultant',
    organization_id: 'org-pango',
    is_active: true,
    last_login_at: '2026-10-22T09:05:00Z',
    created_at: '2026-09-20T10:15:00Z',
  },
  {
    id: 'usr-005',
    full_name: 'Mateo Díaz',
    email: 'mateo.diaz@pango.co',
    password: MOCK_PASSWORD,
    role_id: 'role-requester',
    area_id: 'area-consultant',
    organization_id: 'org-pango',
    is_active: false,
    last_login_at: null,
    created_at: '2026-10-01T11:00:00Z',
  },
];

export const areas: AreaRow[] = loadFromStorage(AREAS_STORAGE_KEY, INITIAL_AREAS);
export const roles: RoleRow[] = loadFromStorage(ROLES_STORAGE_KEY, INITIAL_ROLES);
export const users: UserRow[] = loadFromStorage(USERS_STORAGE_KEY, INITIAL_USERS);

export function persistUsers(): void {
  saveToStorage(USERS_STORAGE_KEY, users);
}

export function persistRoles(): void {
  saveToStorage(ROLES_STORAGE_KEY, roles);
}

export function persistAreas(): void {
  saveToStorage(AREAS_STORAGE_KEY, areas);
}

export function resetMockDatabase(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(USERS_STORAGE_KEY);
    localStorage.removeItem(ROLES_STORAGE_KEY);
    localStorage.removeItem(AREAS_STORAGE_KEY);
  }
  users.length = 0;
  users.push(...INITIAL_USERS);
  roles.length = 0;
  roles.push(...INITIAL_ROLES);
  areas.length = 0;
  areas.push(...INITIAL_AREAS);
}

export const findUserByEmail = (email: string) =>
  users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());

export const findUserById = (id: string) => users.find((user) => user.id === id);

export const findRoleById = (id: string) => roles.find((role) => role.id === id);

export const findAreaById = (id: string) => areas.find((area) => area.id === id);
