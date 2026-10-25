import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from './auth.store';
import { hasAnyPermission } from './permissions';
import { restoreSession } from './session.api';
import { type Permission } from '@/core/auth/user';

/** Location the user tried to open before being sent to /login. */
export interface LoginRedirectState {
  from?: string;
}

function SessionCheck() {
  return (
    <div role="status" className="flex h-dvh w-full items-center justify-center text-sm text-muted">
      Verificando sesión…
    </div>
  );
}

/** Checks the session cookie (`GET /auth/me`) once per app load, while the status is `unknown`. */
function useSessionStatus() {
  const status = useAuthStore((state) => state.status);
  useEffect(() => {
    if (status === 'unknown') void restoreSession();
  }, [status]);
  return status;
}

export function RequireAuth() {
  const status = useSessionStatus();
  const location = useLocation();

  if (status === 'unknown') return <SessionCheck />;
  if (status === 'anonymous') {
    const state: LoginRedirectState = { from: location.pathname + location.search };
    return <Navigate to="/login" replace state={state} />;
  }
  return <Outlet />;
}

/** For public-only pages (login): an authenticated user is sent to the app. */
export function RequireGuest() {
  const status = useSessionStatus();

  if (status === 'unknown') return <SessionCheck />;
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return <Outlet />;
}

export function RequirePermission({ anyOf }: { anyOf: Permission[] }) {
  const user = useAuthStore((state) => state.user);
  return hasAnyPermission(user, anyOf) ? <Outlet /> : <Navigate to="/" replace />;
}
