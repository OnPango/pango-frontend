import { authHttp } from '@/core/api/authHttp';
import type { SessionResponseDto } from '@/core/auth/user.mappers';
import type {
  AcceptInvitationRequest,
  InvitationPreviewDto,
  LoginDto,
  SignupRequest,
  SignupResponseDto,
  SignupResult,
} from '../types/auth';
import { toSignupResult } from './auth.mappers';

/**
 * `POST /auth/login`, on the organization's subdomain. Resolves with the session (tokens + user);
 * the caller starts it. Rejects with a coded error (`INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`,
 * `NOT_A_MEMBER`…); see `lib/auth.errors.ts`.
 */
export async function login(credentials: LoginDto): Promise<SessionResponseDto> {
  const { data } = await authHttp.post<SessionResponseDto>('/auth/login', {
    email: credentials.email.trim().toLowerCase(),
    password: credentials.password,
  });
  return data;
}

/**
 * `POST /auth/signup`, from the main domain: creates the account, the organization and its
 * isolated schema. Rejects with `EMAIL_TAKEN`, `SUBDOMAIN_TAKEN`, `SUBDOMAIN_INVALID` or
 * `TAX_ID_TAKEN`. The organization does not exist yet, so the API ignores the tenant.
 */
export async function signup(request: SignupRequest): Promise<SignupResult> {
  const { data } = await authHttp.post<SignupResponseDto>('/auth/signup', {
    ...request,
    email: request.email.trim().toLowerCase(),
  });
  return toSignupResult(data, request);
}

/** `POST /auth/verify-email`: consumes the token of the emailed link. */
export async function verifyEmail(token: string): Promise<{ email: string }> {
  const { data } = await authHttp.post<{ email: string }>('/auth/verify-email', { token });
  return data;
}

/**
 * `POST /auth/verify-email/resend`: always answers 202 (it does not reveal whether the email
 * exists). `subdomain` makes the new link point to that organization.
 */
export async function resendVerification(email: string, subdomain?: string): Promise<void> {
  await authHttp.post(
    '/auth/verify-email/resend',
    { email: email.trim().toLowerCase() },
    subdomain ? { headers: { 'X-Tenant': subdomain } } : undefined,
  );
}

/** `GET /invitations/preview`: what the accept page shows before the form is submitted. */
export async function getInvitationPreview(token: string): Promise<InvitationPreviewDto> {
  const { data } = await authHttp.get<InvitationPreviewDto>('/invitations/preview', {
    params: { token },
  });
  return data;
}

/** `POST /invitations/accept`, on the organization's subdomain: joins it and opens a session. */
export async function acceptInvitation(
  request: AcceptInvitationRequest,
): Promise<SessionResponseDto> {
  const { data } = await authHttp.post<SessionResponseDto>('/invitations/accept', request);
  return data;
}
