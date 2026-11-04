import type { SessionProfileDto } from '@/core/auth/user.mappers';
import {
  areas,
  findOrganizationById,
  findOrganizationBySlug,
  findOrganizationByTaxId,
  findRoleById,
  findUserByEmail,
  findUserById,
  invitations,
  loadVerificationTokens,
  organizations,
  persistOrganizations,
  persistUsers,
  saveVerificationTokens,
  users,
  type OrganizationRow,
  type UserRow,
} from '../db';
import { requestContext, type MockResponse, type MockRoutes } from '../server';
import {
  clearRefreshCookie,
  consumeRefreshToken,
  issueTokens,
  readBearer,
  readRefreshCookie,
  revokeRefreshToken,
} from '../session';

/** Error body with the backend's shape: `{ statusCode, code, message }`. */
const error = (status: number, code: string, message: string): MockResponse => ({
  status,
  data: { statusCode: status, code, message },
});

/** Mock ids are strings; the real API uses integers. A stable hash keeps the DTO shape. */
const numericId = (id: string) =>
  [...id].reduce((hash, c) => (hash * 31 + c.charCodeAt(0)) >>> 0, 7);

const MIN_PASSWORD_LENGTH = 8;
const SUBDOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}[a-z0-9]$/;
const RESERVED_SUBDOMAINS = [
  'admin',
  'api',
  'app',
  'assets',
  'auth',
  'cdn',
  'dashboard',
  'docs',
  'help',
  'login',
  'mail',
  'pango',
  'onpango',
  'signup',
  'static',
  'status',
  'support',
  'www',
];

/** The organization a request targets (`X-Tenant`), like the backend's tenant resolver. */
const tenantOf = () => requestContext.headers['x-tenant']?.trim().toLowerCase() || null;

/** `SELECT ... FROM accounts JOIN organizations JOIN roles` → the session profile the API returns. */
function toSessionProfile(user: UserRow): SessionProfileDto {
  const role = findRoleById(user.role_id);
  const organization = findOrganizationById(user.organization_id);
  return {
    account: { id: numericId(user.id), email: user.email, name: user.full_name },
    organization: {
      id: numericId(user.organization_id),
      subdomain: organization?.slug ?? '',
      legalName: organization?.name ?? '',
    },
    user: {
      id: numericId(user.id),
      jobTitle: null,
      roles: [
        {
          id: numericId(user.role_id),
          name: role?.name ?? '',
          isSystem: user.role_id === 'role-admin',
          warehouse: null,
          permissions: role?.permissions ?? [],
        },
      ],
    },
  };
}

const startSession = (user: UserRow): MockResponse => {
  const profile = toSessionProfile(user);
  return {
    status: 200,
    data: {
      ...issueTokens(user.id, user.organization_id, profile.organization.subdomain),
      ...profile,
    },
  };
};

/** Stands in for the confirmation email: the link goes to the browser console. */
function issueVerificationLink(user: UserRow, subdomain: string): string {
  const token = crypto.randomUUID().replaceAll('-', '');
  const tokens = loadVerificationTokens();
  for (const [existing, email] of Object.entries(tokens)) {
    if (email === user.email) delete tokens[existing];
  }
  tokens[token] = user.email;
  saveVerificationTokens(tokens);
  const link = `${window.location.origin}/verify-email?token=${token}`;
  console.info(`[mock] Correo de confirmación para ${user.email} (${subdomain}): ${link}`);
  return link;
}

const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export const authRoutes: MockRoutes = {
  /**
   * Owner sign-up: account + organization + first user, all or nothing. Everything is validated
   * before the first row is written. The new owner must confirm the email before logging in.
   */
  'POST /auth/signup': ({ body }) => {
    const input = (body ?? {}) as Record<string, unknown>;
    const org = (input.organization ?? {}) as Record<string, unknown>;
    const name = str(input.name);
    const email = str(input.email).toLowerCase();
    const password = typeof input.password === 'string' ? input.password : '';
    const subdomain = str(org.subdomain).toLowerCase();
    const legalName = str(org.legalName);
    const taxId = str(org.taxId) || null;

    if (
      !name ||
      !email ||
      !legalName ||
      !subdomain ||
      !str(org.country) ||
      !str(org.city) ||
      !str(org.businessSector) ||
      !str(org.teamSize) ||
      !str(org.productCount)
    ) {
      return error(
        422,
        'VALIDATION_FAILED',
        'Completa todos los datos de la empresa y de tu cuenta.',
      );
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return error(
        422,
        'VALIDATION_FAILED',
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      );
    }
    if (!SUBDOMAIN_PATTERN.test(subdomain) || RESERVED_SUBDOMAINS.includes(subdomain)) {
      return error(400, 'SUBDOMAIN_INVALID', 'This subdomain is not allowed');
    }
    // The mock keeps one user row per email, so it cannot attach a second organization to an account.
    if (findUserByEmail(email))
      return error(409, 'EMAIL_TAKEN', 'An account with this email already exists');
    if (findOrganizationBySlug(subdomain)) {
      return error(409, 'SUBDOMAIN_TAKEN', 'This subdomain is already in use');
    }
    if (taxId && findOrganizationByTaxId(taxId)) {
      return error(409, 'TAX_ID_TAKEN', 'An organization with this tax ID already exists');
    }

    const now = new Date().toISOString();
    const suffix = Date.now().toString(36);
    const newOrganization: OrganizationRow = {
      id: `org-${suffix}`,
      name: legalName,
      slug: subdomain,
      tax_id: taxId,
      business_sector: str(org.businessSector),
      team_size: str(org.teamSize),
      product_count: str(org.productCount),
      country: str(org.country),
      city: str(org.city),
      contact_phone: str(org.contactPhone) || null,
      created_at: now,
    };
    const owner: UserRow = {
      id: `usr-${suffix}`,
      full_name: name,
      email,
      password,
      // The mock shares one set of seed roles and areas across organizations.
      role_id: 'role-admin',
      area_id: 'area-admin',
      organization_id: newOrganization.id,
      email_verified: false,
      is_active: true,
      last_login_at: null,
      created_at: now,
    };

    organizations.push(newOrganization);
    users.unshift(owner);
    persistOrganizations();
    persistUsers();
    issueVerificationLink(owner, subdomain);
    return {
      status: 201,
      data: {
        verificationRequired: true,
        email,
        organization: { subdomain },
        verificationEmailSent: true,
      },
    };
  },

  'POST /auth/verify-email': ({ body }) => {
    const token = str((body as { token?: unknown } | null)?.token);
    const tokens = loadVerificationTokens();
    const user = tokens[token] ? findUserByEmail(tokens[token]) : undefined;
    if (!user) {
      return error(
        400,
        'VERIFICATION_TOKEN_INVALID',
        'This confirmation link is invalid, was already used or has expired',
      );
    }
    user.email_verified = true;
    delete tokens[token];
    saveVerificationTokens(tokens);
    persistUsers();
    return { status: 200, data: { email: user.email } };
  },

  // Always 202, so it never reveals whether the email exists.
  'POST /auth/verify-email/resend': ({ body }) => {
    const email = str((body as { email?: unknown } | null)?.email).toLowerCase();
    const user = findUserByEmail(email);
    if (user && user.email_verified === false) {
      issueVerificationLink(user, findOrganizationById(user.organization_id)?.slug ?? '');
    }
    return { status: 202 };
  },

  'POST /auth/login': ({ body }) => {
    const input = (body ?? {}) as Record<string, unknown>;
    const email = str(input.email).toLowerCase();
    const password = typeof input.password === 'string' ? input.password : '';
    if (!email || !password)
      return error(422, 'VALIDATION_FAILED', 'El correo y la contraseña son obligatorios.');

    const subdomain = tenantOf();
    if (!subdomain) return error(400, 'TENANT_REQUIRED', 'The organization subdomain is required');
    const organization = findOrganizationBySlug(subdomain);
    if (!organization) return error(404, 'ORGANIZATION_NOT_FOUND', 'Organization not found');

    const user = findUserByEmail(email);
    // Same answer for "unknown email" and "wrong password" so accounts cannot be enumerated.
    if (!user || user.password !== password) {
      return error(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }
    if (user.email_verified === false) {
      return error(403, 'EMAIL_NOT_VERIFIED', 'Confirm your email address before logging in');
    }
    if (user.organization_id !== organization.id) {
      return error(403, 'NOT_A_MEMBER', 'This user does not belong to this organization');
    }
    if (!user.is_active) {
      return error(403, 'USER_DISABLED', 'This user is disabled in this organization');
    }

    user.last_login_at = new Date().toISOString();
    persistUsers();
    return startSession(user);
  },

  // No body: the refresh token comes from the cookie, like in the real API.
  'POST /auth/refresh': () => {
    const subdomain = tenantOf();
    if (!subdomain) return error(400, 'TENANT_REQUIRED', 'The organization subdomain is required');

    const token = readRefreshCookie(subdomain);
    if (!token) return error(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');

    const consumed = consumeRefreshToken(token);
    const user = consumed ? findUserById(consumed.userId) : undefined;
    if (!consumed || !user || !user.is_active) {
      // A rejected token is useless; the API clears the cookie so the client stops sending it.
      clearRefreshCookie(subdomain);
      return error(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
    }
    if (findOrganizationById(consumed.orgId)?.slug !== subdomain) {
      clearRefreshCookie(subdomain);
      return error(403, 'TENANT_MISMATCH', 'This session belongs to a different organization');
    }
    return startSession(user);
  },

  'POST /auth/logout': () => {
    const subdomain = tenantOf();
    if (!subdomain) return error(400, 'TENANT_REQUIRED', 'The organization subdomain is required');
    const token = readRefreshCookie(subdomain);
    if (token) revokeRefreshToken(token);
    clearRefreshCookie(subdomain);
    return { status: 204 };
  },

  'GET /auth/me': () => {
    const session = readBearer(requestContext.headers);
    const user = session ? findUserById(session.sub) : undefined;
    if (!user || !user.is_active) {
      return error(401, 'UNAUTHENTICATED', 'Missing, invalid or expired access token');
    }
    return { status: 200, data: toSessionProfile(user) };
  },

  'GET /invitations/preview': ({ query }) => {
    const invitation = invitations.find((i) => i.token === query.token);
    const expired = invitation && new Date(invitation.expires_at).getTime() <= Date.now();
    const organization = invitation && findOrganizationById(invitation.organization_id);
    if (!invitation || invitation.used || expired || !organization) {
      return error(
        404,
        'INVITATION_INVALID',
        'This invitation is invalid, was already used or has expired',
      );
    }
    return {
      status: 200,
      data: {
        email: invitation.email,
        organization: { subdomain: organization.slug, legalName: organization.name },
        invitedBy: invitation.invited_by,
        expiresAt: invitation.expires_at,
        hasAccount: !!findUserByEmail(invitation.email),
      },
    };
  },

  'POST /invitations/accept': ({ body }) => {
    const input = (body ?? {}) as Record<string, unknown>;
    const invitation = invitations.find((i) => i.token === str(input.token));
    const password = typeof input.password === 'string' ? input.password : '';
    const subdomain = tenantOf();
    if (!subdomain) return error(400, 'TENANT_REQUIRED', 'The organization subdomain is required');
    if (!invitation || invitation.used || new Date(invitation.expires_at).getTime() <= Date.now()) {
      return error(
        404,
        'INVITATION_INVALID',
        'This invitation is invalid, was already used or has expired',
      );
    }
    const organization = findOrganizationById(invitation.organization_id);
    if (organization?.slug !== subdomain) {
      return error(403, 'TENANT_MISMATCH', 'This session belongs to a different organization');
    }

    let user = findUserByEmail(invitation.email);
    if (user) {
      if (user.password !== password)
        return error(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    } else {
      const name = str(input.name);
      if (!name) return error(400, 'NAME_REQUIRED', 'Your name is required');
      if (password.length < MIN_PASSWORD_LENGTH) {
        return error(
          422,
          'VALIDATION_FAILED',
          `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
        );
      }
      user = {
        id: `usr-${Date.now().toString(36)}`,
        full_name: name,
        email: invitation.email,
        password,
        role_id: invitation.role_id,
        area_id: areas.some((a) => a.id === invitation.area_id) ? invitation.area_id : 'area-admin',
        organization_id: invitation.organization_id,
        is_active: true,
        last_login_at: null,
        created_at: new Date().toISOString(),
      };
      users.unshift(user);
    }
    // Accepting proves the address, exactly as in the real flow.
    user.email_verified = true;
    user.last_login_at = new Date().toISOString();
    invitation.used = true;
    persistUsers();
    return { ...startSession(user), status: 201 };
  },
};
