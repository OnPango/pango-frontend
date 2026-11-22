import { authHttp } from '@/core/api/authHttp';
import type {
  AcceptInvitationDto,
  InvitationPreviewDto,
  LoginCodeRequiredDto,
  LoginDto,
  LoginResponseDto,
  SessionProfileDto,
  SessionResponseDto,
  SignupDto,
  SignupResponseDto,
  VerifyLoginCodeDto,
} from './auth.dto';
import {
  toInvitationPreview,
  toLoginChallenge,
  toLoginResult,
  toSession,
  toSignupResult,
  toUser,
} from './auth.mappers';
import type {
  InvitationPreview,
  LoginChallenge,
  LoginResult,
  Session,
  SignupResult,
} from './auth.types';
import type { User } from './user';

/**
 * Every call to the backend's auth contract (`/auth/*`, `/invitations/*`), in one place. They all go
 * through `authHttp`, which has no 401-renewal interceptor: here a 401 means "wrong credentials" or "no valid session", not "expired access cookie".
 *
 * These functions only talk to the API and answer with domain types (`Session`, `SignupResult`…),
 * never with the raw bodies. Starting or ending the local session is `session.api.ts`.
 */

const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * `POST /auth/login`, on the organization's subdomain: the first step. With the right password the
 * API emails a code and answers which login is pending (its token stays in an HttpOnly cookie); with
 * the second step turned off it answers the session right away. Rejects with a coded error
 * (`INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `NOT_A_MEMBER`…).
 */
export async function login(credentials: LoginDto): Promise<LoginResult> {
  const { data } = await authHttp.post<LoginResponseDto>('/auth/login', {
    email: normalizeEmail(credentials.email),
    password: credentials.password,
  });
  return toLoginResult(data);
}

/**
 * `POST /auth/login/verify`: the code of the pending login opens the session. Rejects with
 * `LOGIN_CODE_INVALID` (with `attemptsLeft`), `LOGIN_CODE_EXPIRED`, `LOGIN_CODE_ATTEMPTS_EXCEEDED`
 * or `LOGIN_CHALLENGE_INVALID`; the last two end the login.
 */
export async function verifyLoginCode(code: string, rememberDevice = false): Promise<Session> {
  // Only when asked: an API without trusted devices rejects unknown fields.
  const body: VerifyLoginCodeDto = rememberDevice ? { code, rememberDevice } : { code };
  const { data } = await authHttp.post<SessionResponseDto>('/auth/login/verify', body);
  return toSession(data);
}

/**
 * `POST /auth/login/resend`: emails a new code for the pending login (the previous one stops
 * working). Rejects with `LOGIN_CODE_RESEND_TOO_SOON` (with `retryAfterSeconds`) or
 * `LOGIN_CODE_RESEND_LIMIT`.
 */
export async function resendLoginCode(): Promise<LoginChallenge> {
  const { data } = await authHttp.post<LoginCodeRequiredDto>('/auth/login/resend');
  return toLoginChallenge(data);
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

/**
 * `GET /auth/me`: who the access cookie belongs to. Read-only (unlike refresh it rotates nothing), so
 * it is how the app recognizes a session on load while the access cookie is still alive. Rejects with
 * 401 `UNAUTHENTICATED` when the cookie is missing or expired.
 */
export async function getMe(): Promise<User> {
  const { data } = await authHttp.get<SessionProfileDto>('/auth/me');
  return toUser(data);
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
