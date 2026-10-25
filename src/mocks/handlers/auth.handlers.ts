import type { UserDto } from '@/core/auth/user.mappers';
import { findRoleById, findUserByEmail, findUserById, type UserRow } from '../db';
import type { MockRoutes } from '../server';
import { destroySession, issueSession, readSession } from '../session';

/** `SELECT ... FROM users JOIN roles` → the DTO the backend would return. */
function toUserDto(user: UserRow): UserDto {
  const role = findRoleById(user.role_id);
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: {
      id: role?.id ?? '',
      name: role?.name ?? 'Sin rol',
      permissions: role?.permissions ?? [],
    },
    area_id: user.area_id,
    organization_id: user.organization_id,
  };
}

const error = (status: number, message: string) => ({ status, data: { message } });

const readCredentials = (body: unknown) => {
  const { email, password } = (body ?? {}) as Record<string, unknown>;
  return {
    email: typeof email === 'string' ? email : '',
    password: typeof password === 'string' ? password : '',
  };
};

export const authRoutes: MockRoutes = {
  'POST /auth/login': ({ body }) => {
    const { email, password } = readCredentials(body);
    if (!email || !password) return error(422, 'El correo y la contraseña son obligatorios.');

    const user = findUserByEmail(email);
    // Same message for "unknown email" and "wrong password" so accounts cannot be enumerated.
    if (!user || user.password !== password) return error(401, 'Correo o contraseña incorrectos.');
    if (!user.is_active) return error(403, 'Tu usuario está inactivo. Contacta al administrador.');

    user.last_login_at = new Date().toISOString();
    issueSession(user.id);
    return { status: 200, data: { user: toUserDto(user) } };
  },

  'GET /auth/me': () => {
    const session = readSession();
    const user = session ? findUserById(session.sub) : undefined;
    if (!user || !user.is_active) {
      destroySession();
      return error(401, 'Tu sesión expiró. Inicia sesión de nuevo.');
    }
    return { status: 200, data: { user: toUserDto(user) } };
  },

  'POST /auth/logout': () => {
    destroySession();
    return { status: 204 };
  },
};
