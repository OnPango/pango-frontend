import { isAxiosError } from 'axios';
import { authHttp } from '@/core/api/authHttp';
import { getCurrentTenant } from '@/core/tenant/tenant';
import { useAuthStore } from './auth.store';
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

/**
 * Runs `task` while holding a lock shared by every tab of this origin. The cookie is shared by all
 * tabs and the token inside it rotates; a reused one counts as theft (the backend then ends every
 * session), so two tabs must never refresh at the same time.
 */
async function withRefreshLock(task: () => Promise<boolean>): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.locks) return task();
  return await navigator.locks.request('pango-refresh-session', task);
}

let pendingRefresh: Promise<boolean> | null = null;

/**
 * `POST /auth/refresh`: the browser sends the refresh cookie, the API rotates it (sets a new one)
 * and returns a new session. Resolves `true` when the session was renewed and `false` when there
 * is nothing to renew or the server refused. Calls made while one is in flight (several 401s at
 * once, StrictMode double effects) share it.
 */
export function refreshSession(): Promise<boolean> {
  pendingRefresh ??= withRefreshLock(async () => {
    // Sessions belong to one organization: on the main domain there is nothing to renew.
    if (!getCurrentTenant() || !hasSessionHint()) return false;
    try {
      const { data } = await authHttp.post<SessionResponseDto>('/auth/refresh');
      applySession(data);
      return true;
    } catch (error) {
      // Offline or a server hiccup must not log the user out: the cookie is still there.
      if (isRejection(error)) clearSessionHint();
      return false;
    }
  }).finally(() => {
    pendingRefresh = null;
  });
  return pendingRefresh;
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
  await authHttp.post('/auth/logout');
}
