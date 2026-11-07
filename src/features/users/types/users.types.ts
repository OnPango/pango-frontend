import type { Permission } from '@/core/auth/user';

export interface WarehouseRef {
  id: string;
  name: string;
}

/** A role granted to a user, on one warehouse or on all of them (`warehouse` null). */
export interface RoleAssignment {
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
  /** Holds a system role (Owner) on every warehouse. */
  isAdmin: boolean;
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
  /** Omitted: the role applies to every warehouse. */
  warehouseId: string | null;
}

export interface UpdateUserInput {
  id: string;
  /** Null (or empty) clears it. */
  jobTitle: string | null;
}

export interface RoleAssignmentInput {
  roleId: string;
  /** Null: every warehouse. */
  warehouseId: string | null;
}

export interface SetUserRolesInput {
  id: string;
  roles: RoleAssignmentInput[];
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
