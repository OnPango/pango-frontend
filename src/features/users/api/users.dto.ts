import type { Permission } from '@/core/auth/user';

/**
 * Bodies of the users / roles / areas endpoints, as the API names them (snake_case). Only
 * `users.mappers.ts` and `users.api.ts` know these shapes; the rest of the feature uses the types in
 * `types/users.types.ts`.
 */

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

/** `POST /users` */
export interface CreateUserDto {
  full_name: string;
  email: string;
  role_id: string;
  area_id: string;
  password?: string;
}

/** `PUT /users/:id` */
export interface UpdateUserDto extends CreateUserDto {
  is_active: boolean;
}

/** `PATCH /users/:id/status` */
export interface UserStatusDto {
  is_active: boolean;
}

/** `POST /roles` and `PUT /roles/:id` */
export interface RoleBodyDto {
  name: string;
  description?: string;
  permissions: Permission[];
}
