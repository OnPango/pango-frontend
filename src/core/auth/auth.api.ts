import { authHttp } from '@/core/api/authHttp';
import type {
  AcceptInvitationDto,
  InvitationPreviewDto,
  LoginDto,
  SessionResponseDto,
  SignupDto,
  SignupResponseDto,
} from './auth.dto';
import { toInvitationPreview, toSession, toSignupResult } from './auth.mappers';
import type { InvitationPreview, Session, SignupResult } from './auth.types';

/**
 * Every call to the backend's auth contract (`/auth/*`, `/invitations/*`), in one place. They all go
 * through `authHttp`, which has no 401-renewal interceptor: here a 401 means "wrong credentials" or "no valid session", not "expired access cookie".
 *
 * These functions only talk to the API and answer with domain types (`Session`, `SignupResult`…),
 * never with the raw bodies. Starting or ending the local session is `session.api.ts`.
 */

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * `POST /auth/login`, on the organization's subdomain. Rejects with a coded error
 * (`INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `NOT_A_MEMBER`…).
 */
export async function login(credentials: LoginDto): Promise<Session> {
  const { data } = await authHttp.post<SessionResponseDto>('/auth/login', {
    email: normalizeEmail(credentials.email),
    password: credentials.password,
  });
  return toSession(data);
}

/**
 * `POST /auth/signup`, from the main domain: creates the account, the organization and its
 * isolated schema. The organization does not exist yet, so the API ignores the tenant. Rejects with
 * `EMAIL_TAKEN`, `SUBDOMAIN_TAKEN`, `SUBDOMAIN_INVALID` or `TAX_ID_TAKEN`.
 */
export async function signup(request: SignupDto): Promise<SignupResult> {
  const { data } = await authHttp.post<SignupResponseDto>('/auth/signup', {
    ...request,
    email: normalizeEmail(request.email),
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
    { email: normalizeEmail(email) },
    subdomain ? { headers: { 'X-Tenant': subdomain } } : undefined,
  );
}

/**
 * `POST /auth/refresh`: the browser sends the refresh cookie, the API rotates it (sets a new one)
 * and answers with a new session. No body.
 */
export async function refresh(): Promise<Session> {
  const { data } = await authHttp.post<SessionResponseDto>('/auth/refresh');
  return toSession(data);
}

/** `POST /auth/logout`: the API revokes the cookie's refresh token and clears the cookie. */
export async function logout(): Promise<void> {
  await authHttp.post('/auth/logout');
}

/** `GET /invitations/preview`: what the accept page shows before the form is submitted. */
export async function getInvitationPreview(token: string): Promise<InvitationPreview> {
  const { data } = await authHttp.get<InvitationPreviewDto>('/invitations/preview', {
    params: { token },
  });
  return toInvitationPreview(data);
}

/** `POST /invitations/accept`, on the organization's subdomain: joins it and opens a session. */
export async function acceptInvitation(request: AcceptInvitationDto): Promise<Session> {
  const { data } = await authHttp.post<SessionResponseDto>('/invitations/accept', request);
  return toSession(data);
}
