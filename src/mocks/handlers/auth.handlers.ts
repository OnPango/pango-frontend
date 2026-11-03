import type { UserDto } from '@/core/auth/user.mappers';
import type { RegisterOrganizationDto } from '@/features/auth/types/auth';
import {
  findOrganizationByTaxId,
  findRoleById,
  findUserByEmail,
  findUserById,
  isWorkspaceSlugTaken,
  organizations,
  persistOrganizations,
  persistUsers,
  users,
  type OrganizationRow,
  type UserRow,
} from '../db';
import type { MockRoutes } from '../server';
import { destroySession, issueSession, readSession } from '../session';

/** `SELECT ... FROM users JOIN roles` → the DTO the backend would return. */
function toUserDto(user: UserRow): UserDto {
  const role = findRoleById(user.role_id);
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: {
      id: role?.id ?? '',
      name: role?.name ?? 'Sin rol',
      permissions: role?.permissions ?? [],
    },
    area_id: user.area_id,
    organization_id: user.organization_id,
  };
}

const error = (status: number, message: string) => ({ status, data: { message } });

const readCredentials = (body: unknown) => {
  const { email, password } = (body ?? {}) as Record<string, unknown>;
  return {
    email: typeof email === 'string' ? email : '',
    password: typeof password === 'string' ? password : '',
  };
};

const MIN_PASSWORD_LENGTH = 8;
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

export const authRoutes: MockRoutes = {
  /**
   * CU-13: organization + first administrator, all or nothing. Everything is validated before the
   * first row is written, so a rejection never leaves a half-created organization behind.
   */
  'POST /auth/register': ({ body }) => {
    const {
      organization,
      admin,
      terms_accepted: termsAccepted,
    } = (body ?? {}) as Partial<RegisterOrganizationDto>;
    const name = organization?.name?.trim() ?? '';
    const slug = organization?.slug?.trim().toLowerCase() ?? '';
    const taxId = organization?.tax_id?.trim() || null;
    const adminName = admin?.full_name?.trim() ?? '';
    const adminEmail = admin?.email?.trim().toLowerCase() ?? '';
    const password = admin?.password ?? '';

    if (
      !name ||
      !slug ||
      !organization?.sector ||
      !organization.team_size ||
      !organization.country ||
      !adminName ||
      !adminEmail ||
      !password
    ) {
      return error(422, 'Completa todos los datos de la empresa y de tu cuenta.');
    }
    if (termsAccepted !== true) {
      return error(422, 'Debes aceptar los términos de uso y la política de privacidad.');
    }
    if (!SLUG_PATTERN.test(slug)) {
      return error(422, 'La dirección del espacio no es válida.');
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return error(422, `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
    }
    if (isWorkspaceSlugTaken(slug)) {
      return error(409, 'Esa dirección ya está en uso. Elige otra para tu espacio.');
    }
    if (taxId && findOrganizationByTaxId(taxId)) {
      return error(409, 'Ya existe una organización registrada con ese identificador tributario.');
    }
    // The email is unique across the whole platform (RN-013), not only within one organization.
    if (findUserByEmail(adminEmail)) {
      return error(409, 'Ya existe un usuario con este correo electrónico.');
    }

    const now = new Date().toISOString();
    const suffix = Date.now().toString(36);
    const newOrganization: OrganizationRow = {
      id: `org-${suffix}`,
      name,
      slug,
      tax_id: taxId,
      sector: organization.sector,
      team_size: organization.team_size,
      items_range: organization.items_range ?? null,
      country: organization.country,
      city: organization.city ?? null,
      contact_phone: organization.contact_phone ?? null,
      created_at: now,
    };
    const newAdmin: UserRow = {
      id: `usr-${suffix}`,
      full_name: adminName,
      email: adminEmail,
      password,
      // The mock shares one set of seed roles and areas across organizations.
      role_id: 'role-admin',
      area_id: 'area-admin',
      organization_id: newOrganization.id,
      is_active: true,
      last_login_at: null,
      created_at: now,
    };

    organizations.push(newOrganization);
    users.unshift(newAdmin);
    persistOrganizations();
    persistUsers();
    return { status: 201, data: { organization: { id: newOrganization.id, name, slug } } };
  },

  'GET /auth/workspaces/:slug/availability': ({ params }) => {
    const slug = (params.slug ?? '').toLowerCase();
    return {
      status: 200,
      data: { available: SLUG_PATTERN.test(slug) && !isWorkspaceSlugTaken(slug) },
    };
  },

  'POST /auth/login': ({ body }) => {
    const { email, password } = readCredentials(body);
    if (!email || !password) return error(422, 'El correo y la contraseña son obligatorios.');

    const user = findUserByEmail(email);
    // Same message for "unknown email" and "wrong password" so accounts cannot be enumerated.
    if (!user || user.password !== password) return error(401, 'Correo o contraseña incorrectos.');
    if (!user.is_active) return error(403, 'Tu usuario está inactivo. Contacta al administrador.');

    user.last_login_at = new Date().toISOString();
    persistUsers();
    issueSession(user.id);
    return { status: 200, data: { user: toUserDto(user) } };
  },

  'GET /auth/me': () => {
    const session = readSession();
    const user = session ? findUserById(session.sub) : undefined;
    if (!user || !user.is_active) {
      destroySession();
      return error(401, 'Tu sesión expiró. Inicia sesión de nuevo.');
    }
    return { status: 200, data: { user: toUserDto(user) } };
  },

  'POST /auth/logout': () => {
    destroySession();
    return { status: 204 };
  },
};
