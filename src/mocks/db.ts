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

export interface OrganizationRow {
  id: string;
  /** Legal name. */
  name: string;
  /** Subdomain (`<slug>.onpango.com`), unique. */
  slug: string;
  /** Unique across the platform when present. */
  tax_id: string | null;
  business_sector?: string;
  team_size?: string;
  product_count?: string;
  country?: string;
  city?: string;
  contact_phone: string | null;
  created_at: string;
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
  job_title?: string | null;
  organization_id: string;
  /** Owners must confirm their email before logging in; seed users and invitees are verified. */
  email_verified?: boolean;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export const MOCK_PASSWORD = 'Pango123*';

// Bump the version when the shape or the permission codes of the seed data change: data saved by
// an older version would otherwise be loaded as is (e.g. roles holding permissions that no longer exist).
const USERS_STORAGE_KEY = 'pango_mock_db_users_v3';
const ROLES_STORAGE_KEY = 'pango_mock_db_roles_v2';
const AREAS_STORAGE_KEY = 'pango_mock_db_areas_v2';
const ORGANIZATIONS_STORAGE_KEY = 'pango_mock_db_organizations_v3';

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

const INITIAL_ORGANIZATIONS: OrganizationRow[] = [
  {
    id: 'org-pango',
    name: 'Pango',
    slug: 'pango',
    tax_id: '900123456-7',
    business_sector: 'TECHNOLOGY',
    team_size: 'SIZE_6_20',
    product_count: 'COUNT_101_500',
    country: 'CO',
    city: 'Barranquilla',
    contact_phone: '+57 300 000 0000',
    created_at: '2026-09-01T08:00:00Z',
  },
];

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
      'catalog.read',
      'warehouse.read',
      'location.manage',
      'stock.read',
      'replenishment.manage',
      'movement.read',
      'movement.create',
      'movement.confirm',
      'movement.receive',
      'stock_request.read',
      'stock_request.approve',
      'alert.read',
      'alert.resolve',
    ],
  },
  {
    id: 'role-purchasing',
    name: 'Compras',
    description: 'Gestión de proveedores, compras y proyecciones',
    permissions: ['catalog.read', 'supplier.manage', 'forecast.read', 'alert.read'],
  },
  {
    id: 'role-requester',
    name: 'Solicitante',
    description: 'Creación y seguimiento de solicitudes de materiales',
    permissions: ['catalog.read', 'stock_request.read', 'stock_request.create'],
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

export const organizations: OrganizationRow[] = loadFromStorage(
  ORGANIZATIONS_STORAGE_KEY,
  INITIAL_ORGANIZATIONS,
);
export const areas: AreaRow[] = loadFromStorage(AREAS_STORAGE_KEY, INITIAL_AREAS);
export const roles: RoleRow[] = loadFromStorage(ROLES_STORAGE_KEY, INITIAL_ROLES);
export const users: UserRow[] = loadFromStorage(USERS_STORAGE_KEY, INITIAL_USERS);

export function persistUsers(): void {
  saveToStorage(USERS_STORAGE_KEY, users);
}

export function persistRoles(): void {
  saveToStorage(ROLES_STORAGE_KEY, roles);
}

export function persistOrganizations(): void {
  saveToStorage(ORGANIZATIONS_STORAGE_KEY, organizations);
}

export function persistAreas(): void {
  saveToStorage(AREAS_STORAGE_KEY, areas);
}

export function resetMockDatabase(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(USERS_STORAGE_KEY);
    localStorage.removeItem(ROLES_STORAGE_KEY);
    localStorage.removeItem(AREAS_STORAGE_KEY);
    localStorage.removeItem(ORGANIZATIONS_STORAGE_KEY);
  }
  users.length = 0;
  users.push(...INITIAL_USERS);
  roles.length = 0;
  roles.push(...INITIAL_ROLES);
  areas.length = 0;
  areas.push(...INITIAL_AREAS);
  organizations.length = 0;
  organizations.push(...INITIAL_ORGANIZATIONS);
}

export const findUserByEmail = (email: string) =>
  users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());

export const findUserById = (id: string) => users.find((user) => user.id === id);

export const findRoleById = (id: string) => roles.find((role) => role.id === id);

/** Tax ids are compared ignoring case, dots, dashes and spaces: "900.123.456-7" is "9001234567". */
const normalizeTaxId = (taxId: string) => taxId.replace(/[^a-z0-9]/gi, '').toLowerCase();

export const findOrganizationByTaxId = (taxId: string) =>
  organizations.find((org) => !!org.tax_id && normalizeTaxId(org.tax_id) === normalizeTaxId(taxId));

export const findOrganizationBySlug = (slug: string) =>
  organizations.find((org) => org.slug === slug);

export const findOrganizationById = (id: string) => organizations.find((org) => org.id === id);

export const findAreaById = (id: string) => areas.find((area) => area.id === id);

/** An invitation sent by an administrator. In memory only: reloading the page restores the seed. */
export interface InvitationRow {
  token: string;
  email: string;
  organization_id: string;
  role_id: string;
  area_id: string;
  invited_by: string;
  expires_at: string;
  used: boolean;
}

export const invitations: InvitationRow[] = [
  {
    token: 'invite-demo',
    email: 'nuevo@pango.co',
    organization_id: 'org-pango',
    role_id: 'role-requester',
    area_id: 'area-consultant',
    invited_by: 'Carlos Arango',
    expires_at: '2099-01-01T00:00:00Z',
    used: false,
  },
];

const VERIFICATION_STORAGE_KEY = 'pango_mock_verification_tokens_v1';

/** Pending email confirmations: token → email. Persisted so a reload does not lose the link. */
export function loadVerificationTokens(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(VERIFICATION_STORAGE_KEY) ?? '{}') as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
}

export function saveVerificationTokens(tokens: Record<string, string>): void {
  try {
    localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // Storage unavailable: the link only works until the page closes.
  }
}
