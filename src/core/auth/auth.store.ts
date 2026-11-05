import { create } from 'zustand';
import type { User as SessionUser } from './user';

/**
 * - `unknown`: app just loaded, the session cookie has not been exchanged yet.
 * - `authenticated` / `anonymous`: result of that check, of a login or of a logout.
 */
export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

interface AuthState {
  user: SessionUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;

  setSession: (user: SessionUser) => void;
  clearSession: () => void;
}

/**
 * Not persisted on purpose: after a reload the session is rebuilt from the refresh cookie
 * (`restoreSession`), so a stale copy of the user can never outlive the server's view of it.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: 'unknown',
  isAuthenticated: false,
  setSession: (user) => set({ user, status: 'authenticated', isAuthenticated: true }),
  clearSession: () => set({ user: null, status: 'anonymous', isAuthenticated: false }),
}));
