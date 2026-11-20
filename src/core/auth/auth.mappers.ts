import type {
  InvitationPreviewDto,
  LoginCodeRequiredDto,
  LoginResponseDto,
  RoleGrantDto,
  SessionProfileDto,
  SessionResponseDto,
  SignupDto,
  SignupResponseDto,
} from './auth.dto';
import type {
  InvitationPreview,
  LoginChallenge,
  LoginResult,
  Session,
  SignupResult,
} from './auth.types';
import { PERMISSIONS, type Permission, type RoleGrant, type User } from './user';

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

export const toSession = (dto: SessionResponseDto): Session => ({
  user: toUser(dto),
  expiresAt: dto.refreshTokenExpiresAt,
});

export const toLoginChallenge = (dto: LoginCodeRequiredDto): LoginChallenge => ({
  email: dto.email,
  codeLength: dto.codeLength,
  expiresAt: dto.expiresAt,
  resendAvailableAt: dto.resendAvailableAt,
  emailSent: dto.emailSent,
});

export const toLoginResult = (dto: LoginResponseDto): LoginResult =>
  'codeRequired' in dto
    ? { kind: 'code', challenge: toLoginChallenge(dto) }
    : { kind: 'session', session: toSession(dto) };

const isSessionResponse = (dto: SignupResponseDto): dto is SessionResponseDto =>
  !('verificationRequired' in dto);

/**
 * The API answers with a session when the email already belonged to a verified account. That
 * session is for a subdomain the sign-up page is not on, so it is dropped: the owner logs in there.
 */
export function toSignupResult(dto: SignupResponseDto, request: SignupDto): SignupResult {
  if (isSessionResponse(dto)) {
    return { kind: 'ready', email: dto.account.email, subdomain: dto.organization.subdomain };
  }
  return {
    kind: 'verification',
    email: dto.email,
    subdomain: dto.organization.subdomain || request.organization.subdomain,
    emailSent: dto.verificationEmailSent,
  };
}

export const toInvitationPreview = (dto: InvitationPreviewDto): InvitationPreview => ({
  email: dto.email,
  organization: {
    subdomain: dto.organization.subdomain,
    legalName: dto.organization.legalName,
  },
  invitedBy: dto.invitedBy,
  expiresAt: dto.expiresAt,
  hasAccount: dto.hasAccount,
});
