import { create } from 'zustand';
import type { User as SessionUser } from './user';

/**
 * - `unknown`: app just loaded, the stored refresh token has not been exchanged yet.
 * - `authenticated` / `anonymous`: result of that check, of a login or of a logout.
 */
export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

interface AuthState {
  user: SessionUser | null;
  /** Short-lived Bearer token. Memory only: never written to storage. */
  accessToken: string | null;
  status: AuthStatus;
  isAuthenticated: boolean;

  setSession: (user: SessionUser, accessToken: string) => void;
  clearSession: () => void;
}

/**
 * Not persisted on purpose: after a reload the session is rebuilt from the refresh token
 * (`restoreSession`), so a stale copy of the user can never outlive the server's view of it.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  status: 'unknown',
  isAuthenticated: false,
  setSession: (user, accessToken) =>
    set({ user, accessToken, status: 'authenticated', isAuthenticated: true }),
  clearSession: () =>
    set({ user: null, accessToken: null, status: 'anonymous', isAuthenticated: false }),
}));
