import { PERMISSIONS, type Permission, type RoleGrant, type User } from './user';

/**
 * What the backend sends (see `docs/auth.md` in pango-core). Only this file and the API functions
 * know these shapes; the rest of the app uses `User`. If the contract changes, adjust it here.
 */
export interface RoleGrantDto {
  id: number;
  name: string;
  isSystem: boolean;
  warehouse: { id: number; name: string } | null;
  permissions: string[];
}

/** Body of `GET /auth/me`. */
export interface SessionProfileDto {
  account: { id: number; email: string; name: string };
  organization: { id: number; subdomain: string; legalName: string };
  user: { id: number; jobTitle: string | null; roles: RoleGrantDto[] };
}

/**
 * Body of login, refresh, invitation acceptance and the sign-up of a verified account. The refresh
 * token is not here: it only travels in an HttpOnly cookie.
 */
export interface SessionResponseDto extends SessionProfileDto {
  tokenType: 'Bearer';
  accessToken: string;
  /** Access token lifetime in seconds. */
  expiresIn: number;
  /** When the refresh cookie (the session) ends. */
  refreshTokenExpiresAt: string;
}

const isPermission = (value: string): value is Permission =>
  (PERMISSIONS as readonly string[]).includes(value);

function toRoleGrant(dto: RoleGrantDto): RoleGrant {
  return {
    id: String(dto.id),
    name: dto.name,
    isSystem: dto.isSystem,
    warehouse: dto.warehouse ? { id: String(dto.warehouse.id), name: dto.warehouse.name } : null,
    // Unknown codes (a newer backend) are discarded instead of breaking the session.
    permissions: dto.permissions.filter(isPermission),
  };
}

export function toUser(dto: SessionProfileDto): User {
  const roles = dto.user.roles.map(toRoleGrant);
  return {
    id: String(dto.user.id),
    name: dto.account.name,
    email: dto.account.email,
    jobTitle: dto.user.jobTitle,
    organization: {
      id: String(dto.organization.id),
      subdomain: dto.organization.subdomain,
      legalName: dto.organization.legalName,
    },
    roles,
    permissions: [...new Set(roles.flatMap((role) => role.permissions))],
  };
}
