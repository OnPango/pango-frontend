import { isAxiosError } from 'axios';
import { getCurrentTenant } from '@/core/tenant/tenant';
import { logout, refresh } from './auth.api';
import { useAuthStore } from './auth.store';
import { coordinateRefresh } from './refresh.coordinator';
import { clearSessionHint, hasSessionHint, saveSessionHint } from './session.hint';
import { toUser, type SessionResponseDto } from './user.mappers';

/**
 * Starts the local session from a login / refresh / invitation response: the access token goes to
 * memory and the user to the store. The refresh token is not in the response: the browser got it as
 * an HttpOnly cookie. Only the hint (when the session ends) is remembered.
 */
export function applySession(session: SessionResponseDto) {
  saveSessionHint(session.refreshTokenExpiresAt);
  useAuthStore.getState().setSession(toUser(session), session.accessToken);
}

/** Server said the session is no good (cookie missing, expired, revoked, reused) rather than being unreachable. */
const isRejection = (error: unknown) =>
  isAxiosError(error) && !!error.response && error.response.status < 500;

/** One renewal attempt. Resolves `true` when the session was renewed, `false` if it could not be. */
async function renewSession(): Promise<boolean> {
  // Sessions belong to one organization: on the main domain there is nothing to renew.
  if (!getCurrentTenant() || !hasSessionHint()) return false;
  try {
    applySession(await refresh());
    return true;
  } catch (error) {
    // Offline or a server hiccup must not log the user out: the cookie is still there.
    if (isRejection(error)) clearSessionHint();
    return false;
  }
}

/**
 * Renews the session from the refresh cookie (the API rotates it and returns a new session).
 * Resolves `true` when it was renewed and `false` when there is nothing to renew or the server
 * refused. Concurrent calls share one renewal, also across tabs: see `refresh.coordinator.ts`.
 */
export function refreshSession(): Promise<boolean> {
  return coordinateRefresh(renewSession);
}

/** On boot: rebuild the session from the refresh cookie, or become anonymous. */
export async function restoreSession(): Promise<void> {
  if (!(await refreshSession())) useAuthStore.getState().clearSession();
}

/**
 * `POST /auth/logout`: the API revokes the refresh cookie's token and clears the cookie. The local
 * hint is dropped first, so the app forgets the session even if the request fails; the access token
 * simply expires on its own.
 */
export async function logoutRequest(): Promise<void> {
  clearSessionHint();
  await logout();
}
