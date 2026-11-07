/**
 * Bodies of the users, invitations and warehouses endpoints (`docs/auth.md` in pango-core), as the
 * API names them. Only `users.mappers.ts` and `users.api.ts` know these shapes; the rest of the
 * feature uses the types in `types/users.types.ts`.
 */

export interface UserRoleDto {
  id: number;
  name: string;
  isSystem: boolean;
  warehouse: { id: number; name: string } | null;
}

/** `GET /users`, `GET /users/:id` and the answer of every user write. */
export interface UserDto {
  id: number;
  accountId: number;
  email: string;
  name: string;
  jobTitle: string | null;
  department: { id: number; name: string } | null;
  isActive: boolean;
  isAdmin: boolean;
  roles: UserRoleDto[];
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** `GET /users` filters. */
export type UserStatusFilterDto = 'ACTIVE' | 'INACTIVE' | 'ALL';

/** `PATCH /users/:id` */
export interface UpdateUserDto {
  /** Null or empty clears it. */
  jobTitle?: string | null;
  /** Null removes the department. */
  departmentId?: number | null;
}

/** `PUT /users/:id/roles`: replaces every assignment (at least one). */
export interface SetUserRolesDto {
  roles: { roleId: number; warehouseId?: number }[];
}

/** `POST /invitations` */
export interface CreateInvitationDto {
  email: string;
  roleId: number;
  warehouseId?: number;
}

/** `GET /invitations` */
export interface PendingInvitationDto {
  id: number;
  email: string;
  role: { id: number; name: string | null };
  warehouseId: number | null;
  invitedBy: { id: number; name: string };
  expiresAt: string;
  createdAt: string;
  expired: boolean;
}

/** `GET /warehouses` (only what the user screens need). */
export interface WarehouseDto {
  id: number;
  name: string;
  isActive: boolean;
}

/** `GET /roles`, and the answer of `PATCH /roles/:id`. */
export interface RoleDto {
  id: number;
  name: string;
  description: string | null;
  /** System roles (Owner) cannot change. */
  isSystem: boolean;
  /** Permission codes; unknown ones (a newer backend) are discarded by the mapper. */
  permissions: string[];
  /** Assignments of the role to users. */
  assignmentCount: number;
  createdAt: string;
  updatedAt: string;
}

/** `PATCH /roles/:id`: `permissions` replaces every permission of the role. */
export interface UpdateRoleDto {
  name?: string;
  description?: string | null;
  permissions?: string[];
}
