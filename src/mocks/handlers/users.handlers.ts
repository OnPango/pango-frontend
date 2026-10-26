import type { Permission } from '@/core/auth/user';
import {
  areas,
  findAreaById,
  findRoleById,
  findUserByEmail,
  findUserById,
  MOCK_PASSWORD,
  persistRoles,
  persistUsers,
  roles,
  users,
  type RoleRow,
  type UserRow,
} from '../db';
import type { MockRoutes } from '../server';
import { readSession } from '../session';

export interface ManagedUserDto {
  id: string;
  full_name: string;
  email: string;
  role: {
    id: string;
    name: string;
  };
  area: {
    id: string;
    name: string;
  };
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface ManagedRoleDto {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  users_count: number;
}

export interface ManagedAreaDto {
  id: string;
  name: string;
}

function toManagedUserDto(user: UserRow): ManagedUserDto {
  const role = findRoleById(user.role_id);
  const area = findAreaById(user.area_id);
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: {
      id: role?.id ?? user.role_id,
      name: role?.name ?? 'Sin rol',
    },
    area: {
      id: area?.id ?? user.area_id,
      name: area?.name ?? 'Sin área',
    },
    is_active: user.is_active,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
  };
}

function toManagedRoleDto(role: RoleRow): ManagedRoleDto {
  return {
    id: role.id,
    name: role.name,
    description: role.description ?? '',
    permissions: role.permissions,
    users_count: users.filter((u) => u.role_id === role.id).length,
  };
}

const error = (status: number, message: string) => ({ status, data: { message } });

function checkAdminAuth() {
  const session = readSession();
  if (!session) {
    return { error: error(401, 'Tu sesión expiró. Inicia sesión de nuevo.') };
  }
  const user = findUserById(session.sub);
  if (!user || !user.is_active) {
    return { error: error(401, 'Usuario no encontrado o inactivo.') };
  }
  const role = findRoleById(user.role_id);
  const hasAccess =
    role?.permissions.includes('users:manage') || role?.permissions.includes('roles:manage');
  if (!hasAccess) {
    return { error: error(403, 'Acceso denegado: Se requiere rol de Administrador.') };
  }
  return { user, role };
}

export const usersRoutes: MockRoutes = {
  // ---- ÁREAS ----
  'GET /areas': () => {
    return {
      status: 200,
      data: areas.map((a) => ({ id: a.id, name: a.name })),
    };
  },

  // ---- ROLES Y PERMISOS ----
  'GET /roles': () => {
    const auth = checkAdminAuth();
    if (auth.error) return auth.error;

    return {
      status: 200,
      data: roles.map(toManagedRoleDto),
    };
  },

  'POST /roles': ({ body }) => {
    const auth = checkAdminAuth();
    if (auth.error) return auth.error;

    const data = (body ?? {}) as {
      name?: string;
      description?: string;
      permissions?: Permission[];
    };

    if (!data.name?.trim()) {
      return error(422, 'El nombre del rol es obligatorio.');
    }
    if (!data.permissions || data.permissions.length === 0) {
      return error(422, 'Debe asignar al menos un permiso al rol.');
    }

    const nameClean = data.name.trim();
    if (roles.some((r) => r.name.toLowerCase() === nameClean.toLowerCase())) {
      return error(409, 'Ya existe un rol con este nombre.');
    }

    const newRole: RoleRow = {
      id: `role-${Date.now().toString(36)}`,
      name: nameClean,
      description: data.description?.trim() || '',
      permissions: data.permissions,
    };

    roles.push(newRole);
    persistRoles();
    console.info('[mock] Rol creado y guardado en localStorage:', newRole.name);
    return { status: 201, data: toManagedRoleDto(newRole) };
  },

  'PUT /roles/:id': ({ params, body }) => {
    const auth = checkAdminAuth();
    if (auth.error) return auth.error;

    const role = findRoleById(params.id);
    if (!role) return error(404, 'Rol no encontrado.');

    const data = (body ?? {}) as {
      name?: string;
      description?: string;
      permissions?: Permission[];
    };

    if (data.name && data.name.trim() !== role.name) {
      const nameClean = data.name.trim();
      if (roles.some((r) => r.id !== role.id && r.name.toLowerCase() === nameClean.toLowerCase())) {
        return error(409, 'Ya existe otro rol con este nombre.');
      }
      role.name = nameClean;
    }

    if (data.description !== undefined) {
      role.description = data.description.trim();
    }

    if (data.permissions) {
      if (data.permissions.length === 0) {
        return error(422, 'El rol debe tener al menos un permiso.');
      }
      role.permissions = data.permissions;
    }

    persistRoles();
    console.info('[mock] Rol actualizado y guardado en localStorage:', role.name);
    return { status: 200, data: toManagedRoleDto(role) };
  },

  // ---- USUARIOS ----
  'GET /users': () => {
    const auth = checkAdminAuth();
    if (auth.error) return auth.error;

    return {
      status: 200,
      data: users.map(toManagedUserDto),
    };
  },

  'GET /users/:id': ({ params }) => {
    const auth = checkAdminAuth();
    if (auth.error) return auth.error;

    const user = findUserById(params.id);
    if (!user) return error(404, 'Usuario no encontrado.');

    return { status: 200, data: toManagedUserDto(user) };
  },

  'POST /users': ({ body }) => {
    const auth = checkAdminAuth();
    if (auth.error) return auth.error;

    const data = (body ?? {}) as {
      full_name?: string;
      email?: string;
      role_id?: string;
      area_id?: string;
      password?: string;
    };

    if (!data.full_name?.trim()) return error(422, 'El nombre de la persona es obligatorio.');
    if (!data.email?.trim()) return error(422, 'El correo electrónico es obligatorio.');
    if (!data.role_id) return error(422, 'Debe seleccionar un rol.');
    if (!data.area_id) return error(422, 'Debe seleccionar un área.');

    const cleanEmail = data.email.trim().toLowerCase();
    if (findUserByEmail(cleanEmail)) {
      return error(409, 'Ya existe un usuario con este correo electrónico.');
    }

    const nextNum =
      users.reduce((max, u) => {
        const match = u.id.match(/^usr-(\d+)$/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0) + 1;

    const newUser: UserRow = {
      id: `usr-${String(nextNum).padStart(3, '0')}`,
      full_name: data.full_name.trim(),
      email: cleanEmail,
      password: data.password || MOCK_PASSWORD,
      role_id: data.role_id,
      area_id: data.area_id,
      organization_id: 'org-pango',
      is_active: true,
      last_login_at: null,
      created_at: new Date().toISOString(),
    };

    users.unshift(newUser);
    persistUsers();
    console.info('[mock] Usuario creado y guardado en localStorage:', newUser);
    return { status: 201, data: toManagedUserDto(newUser) };
  },

  'PUT /users/:id': ({ params, body }) => {
    const auth = checkAdminAuth();
    if (auth.error) return auth.error;

    const user = findUserById(params.id);
    if (!user) return error(404, 'Usuario no encontrado.');

    const data = (body ?? {}) as {
      full_name?: string;
      email?: string;
      role_id?: string;
      area_id?: string;
      is_active?: boolean;
      password?: string;
    };

    if (data.email && data.email.trim().toLowerCase() !== user.email) {
      const cleanEmail = data.email.trim().toLowerCase();
      if (findUserByEmail(cleanEmail)) {
        return error(409, 'Ya existe otro usuario con este correo electrónico.');
      }
      user.email = cleanEmail;
    }

    if (data.full_name?.trim()) user.full_name = data.full_name.trim();
    if (data.role_id) user.role_id = data.role_id;
    if (data.area_id) user.area_id = data.area_id;
    if (data.password?.trim()) user.password = data.password.trim();
    if (typeof data.is_active === 'boolean') user.is_active = data.is_active;

    persistUsers();
    console.info('[mock] Usuario actualizado y guardado en localStorage:', user);
    return { status: 200, data: toManagedUserDto(user) };
  },

  'PATCH /users/:id/status': ({ params, body }) => {
    const auth = checkAdminAuth();
    if (auth.error) return auth.error;

    const user = findUserById(params.id);
    if (!user) return error(404, 'Usuario no encontrado.');

    // Prevenir desactivarse a uno mismo si es el único admin
    if (auth.user && auth.user.id === user.id) {
      return error(400, 'No puedes desactivar tu propia cuenta activa de administrador.');
    }

    const data = (body ?? {}) as { is_active?: boolean };
    user.is_active = typeof data.is_active === 'boolean' ? data.is_active : !user.is_active;

    persistUsers();
    console.info('[mock] Estado de usuario actualizado y guardado en localStorage:', user);
    return { status: 200, data: toManagedUserDto(user) };
  },
};
