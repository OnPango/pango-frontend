import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './auth.store';
import { hasAnyPermission } from './permissions';
import { type Permission } from '@/core/auth/user';

export function RequireAuth() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export function RequirePermission({ anyOf }: { anyOf: Permission[] }) {
  const user = useAuthStore((state) => state.user);
  return hasAnyPermission(user, anyOf) ? <Outlet /> : <Navigate to="/" replace />;
}
