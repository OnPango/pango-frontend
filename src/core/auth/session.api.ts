import { isAxiosError } from 'axios';
import { getCurrentTenant } from '@/core/tenant/tenant';
import { getMe, logout, refresh } from './auth.api';
import type { Session } from './auth.types';
import { useAuthStore } from './auth.store';
import { coordinateRefresh } from './refresh.coordinator';
import { clearSessionHint, hasSessionHint, saveSessionHint } from './session.hint';

/**
 * Starts the local session from a login / refresh / invitation: the user goes to the store. No token
 * is part of it: the browser got both as HttpOnly cookies. Only the hint (when the session ends) is
 * remembered.
 */
export function applySession(session: Session) {
  saveSessionHint(session.expiresAt);
  useAuthStore.getState().setSession(session.user);
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

/**
 * Recognizes the session from the access cookie alone (`GET /auth/me`). Resolves `false` when there
 * is nothing to recognize or the cookie is gone / expired; the caller then renews the session.
 */
async function recognizeSession(): Promise<boolean> {
  if (!getCurrentTenant() || !hasSessionHint()) return false;
  try {
    useAuthStore.getState().setSession(await getMe());
    return true;
  } catch {
    return false;
  }
}

/**
 * On boot: rebuild the session, or become anonymous. While the access cookie is alive (15 minutes)
 * `GET /auth/me` is enough: it only reads. Otherwise the refresh cookie renews the session, which
 * rotates the token and is the heavier call.
 */
export async function restoreSession(): Promise<void> {
  if (await recognizeSession()) return;
  if (!(await refreshSession())) useAuthStore.getState().clearSession();
}

/**
 * `POST /auth/logout`: the API revokes the refresh cookie's token and clears the cookie. The local
 * hint is dropped first, so the app forgets the session even if the request fails; the access cookie
 * (which JavaScript cannot delete) simply expires on its own.
 */
export async function logoutRequest(): Promise<void> {
  clearSessionHint();
  await logout();
}
