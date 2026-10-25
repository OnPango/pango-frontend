import { http } from '@/core/api/http';
import { useAuthStore } from './auth.store';
import { toUser, type SessionResponseDto } from './user.mappers';
import type { User } from './user';

/** `GET /auth/me`: the user behind the session cookie. Rejects with 401 if there is no valid session. */
export async function getCurrentUser(): Promise<User> {
  const { data } = await http.get<SessionResponseDto>('/auth/me');
  return toUser(data.user);
}

/** `POST /auth/logout`: the backend invalidates the session and expires the cookie. */
export async function logoutRequest(): Promise<void> {
  await http.post('/auth/logout');
}

let pendingRestore: Promise<void> | null = null;

/**
 * Checks the session cookie once on boot and fills the store.
 * Concurrent calls (e.g. StrictMode double effects) share the same request.
 */
export function restoreSession(): Promise<void> {
  pendingRestore ??= getCurrentUser()
    .then((user) => useAuthStore.getState().setSession(user))
    .catch(() => useAuthStore.getState().clearSession())
    .finally(() => {
      pendingRestore = null;
    });
  return pendingRestore;
}
