import type { Permission } from '@/core/auth/user';

export interface WarehouseRef {
  id: string;
  name: string;
}

/** A role granted to a user, on one warehouse or on all of them (`warehouse` null). */
export interface RoleAssignment {
  /** Id of this grant (removing it is `DELETE /users/:id/role-assignments/:assignmentId`). */
  assignmentId: string;
  roleId: string;
  roleName: string;
  isSystem: boolean;
  warehouse: WarehouseRef | null;
}

export interface ManagedUser {
  /** Id of the user inside the organization. */
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  department: { id: string; name: string } | null;
  isActive: boolean;
  /** Holds the Owner role: administers every warehouse. */
  isOwner: boolean;
  roles: RoleAssignment[];
  joinedAt: string | null;
  createdAt: string;
}

/** A role the user can be given. */
export interface RoleOption {
  id: string;
  name: string;
  isSystem: boolean;
}

export interface WarehouseOption {
  id: string;
  name: string;
}

export interface PendingInvitation {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
  /** Null: the role applies to every warehouse. */
  warehouseId: string | null;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
  expired: boolean;
}

/**
 * A row of the people table: someone who already belongs to the organization, or someone who was
 * invited and has not accepted yet. `id` is unique across both kinds.
 */
export type UserListItem =
  | { kind: 'user'; id: string; user: ManagedUser }
  | { kind: 'invitation'; id: string; invitation: PendingInvitation };

export interface InviteUserInput {
  email: string;
  roleId: string;
  /** Null only for the Owner role, which applies to every warehouse. */
  warehouseId: string | null;
}

export interface UpdateUserInput {
  id: string;
  /** Null (or empty) clears it; absent leaves it as it is. */
  jobTitle?: string | null;
  /** Null removes the person from their area; absent leaves it as it is. */
  departmentId?: string | null;
}

/** An area (department) a person can belong to. */
export interface DepartmentOption {
  id: string;
  name: string;
  isActive: boolean;
}

export interface RoleAssignmentInput {
  roleId: string;
  /** Null: every warehouse (only the Owner role). */
  warehouseId: string | null;
}

/** Grants and removals that turn a user's roles into the wanted ones. */
export interface ChangeUserRolesInput {
  id: string;
  /** Applied first, so the user is never left without a role. */
  add: RoleAssignmentInput[];
  /** Assignment ids to remove. */
  remove: string[];
}

export interface ManagedRole {
  id: string;
  name: string;
  description: string | null;
  /** System roles (Owner) hold every permission and cannot change. */
  isSystem: boolean;
  permissions: Permission[];
  /** People holding the role. */
  assignmentCount: number;
}

export interface UpdateRolePermissionsInput {
  id: string;
  permissions: Permission[];
}

/** `POST /roles`: the role starts with these permissions (none is fine). */
export interface CreateRoleInput {
  name: string;
  description: string | null;
  permissions: Permission[];
}

/** `PATCH /roles/:id` with only the name and description (absent: unchanged). */
export interface UpdateRoleDetailsInput {
  id: string;
  name?: string;
  description?: string | null;
}
