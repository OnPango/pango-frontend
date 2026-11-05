import { useEffect, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from './auth.store';
import { hasAnyPermission } from './permissions';
import { restoreSession } from './session.api';
import { type Permission } from '@/core/auth/user';

/** What /login may receive through the router state. */
export interface LoginRedirectState {
  /** Location the user tried to open before being sent to /login. */
  from?: string;
}

/**
 * The status is `unknown` until the session is restored once per app load. `core` knows nothing
 * about UI screens, so the app passes what to show meanwhile (`loadingFallback`), as it does with
 * the `fallback` of `RequirePermission`.
 */
interface SessionGuardProps {
  loadingFallback: ReactNode;
}

/** Rebuilds the session from the cookies once per app load, while the status is `unknown`. */
function useSessionStatus() {
  const status = useAuthStore((state) => state.status);
  useEffect(() => {
    if (status === 'unknown') void restoreSession();
  }, [status]);
  return status;
}

export function RequireAuth({ loadingFallback }: SessionGuardProps) {
  const status = useSessionStatus();
  const location = useLocation();

  if (status === 'unknown') return loadingFallback;
  if (status === 'anonymous') {
    const state: LoginRedirectState = { from: location.pathname + location.search };
    return <Navigate to="/login" replace state={state} />;
  }
  return <Outlet />;
}

/** For public-only pages (login): an authenticated user is sent to the app. */
export function RequireGuest({ loadingFallback }: SessionGuardProps) {
  const status = useSessionStatus();

  if (status === 'unknown') return loadingFallback;
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return <Outlet />;
}

/**
 * Renders the child routes only if the user has at least one of `anyOf`. Otherwise it renders
 * `fallback`: `core` knows nothing about UI screens, so the app passes its own "forbidden" page.
 */
export function RequirePermission({
  anyOf,
  fallback = <Navigate to="/" replace />,
}: {
  anyOf: Permission[];
  fallback?: ReactNode;
}) {
  const user = useAuthStore((state) => state.user);
  return hasAnyPermission(user, anyOf) ? <Outlet /> : fallback;
}
