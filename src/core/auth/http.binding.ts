import { configureHttpAuth } from '@/core/api/http';
import { useAuthStore } from './auth.store';
import { refreshSession } from './session.api';

/**
 * Connects the authenticated HTTP client to the session: it renews the session on a 401 and drops
 * it when renewal fails. Call it once at startup.
 */
export function bindHttpToSession(): void {
  configureHttpAuth({
    refresh: refreshSession,
    onSessionExpired: () => useAuthStore.getState().clearSession(),
  });
}
