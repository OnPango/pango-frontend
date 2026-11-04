/**
 * The refresh token is an HttpOnly cookie: JavaScript cannot see it, so it cannot tell whether a
 * session exists. This hint remembers only "this browser signed in and the session lasts until X",
 * so the app does not call `/auth/refresh` (and log a pointless 401) for every first-time visitor.
 *
 * It is NOT a credential: it holds no token, and deleting or forging it changes nothing the server
 * enforces. At worst a missing hint makes a still-valid session look signed out until the next login.
 * Storage can throw (private mode), so every access is guarded.
 */

const KEY = 'pango.session_until';

export function saveSessionHint(expiresAt: string): void {
  try {
    window.localStorage.setItem(KEY, expiresAt);
  } catch {
    // Storage unavailable: the session is restored on the next login instead.
  }
}

/** Whether this browser may still hold a valid session cookie. */
export function hasSessionHint(): boolean {
  try {
    const expiresAt = window.localStorage.getItem(KEY);
    return !!expiresAt && new Date(expiresAt).getTime() > Date.now();
  } catch {
    return false;
  }
}

export function clearSessionHint(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
