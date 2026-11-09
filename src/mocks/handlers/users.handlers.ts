import { PERMISSIONS, type Permission } from '@/core/auth/user';
import {
  areas,
  findAreaById,
  findRoleById,
  findUserByEmail,
  invitations,
  persistRoles,
  persistUsers,
  roles,
  users,
  type InvitationRow,
  type RoleRow,
  type UserRow,
} from '../db';
import { numericId, roleApiName, roleNumericId } from '../ids';
import { authorize, error } from '../guard';
import { type MockRoutes } from '../server';

/**
 * The users, invitations and warehouses endpoints of pango-core, on top of the mock database. The
 * mock keeps one role per user and no warehouse scoping, so `POST /users/:id/role-assignments`
 * replaces the user's role (the warehouse is accepted but not stored) and removing an assignment
 * that is no longer the current one changes nothing. Departments have no list endpoint, like in the
 * real API.
 */

const INVITATION_TTL_MS = 72 * 60 * 60 * 1000;

const isAdmin = (user: UserRow) => user.role_id === 'role-admin';

/** Stable id of the user's (single) role assignment. */
const assignmentIdOf = (user: UserRow) => numericId(`${user.id}:${user.role_id}`);

function toUserDto(user: UserRow) {
  const role = findRoleById(user.role_id);
  const area = findAreaById(user.area_id);
  return {
    id: numericId(user.id),
    accountId: numericId(user.id),
    email: user.email,
    name: user.full_name,
    jobTitle: user.job_title ?? null,
    department: area ? { id: numericId(area.id), name: area.name } : null,
    isActive: user.is_active,
    isOwner: isAdmin(user),
    roles: [
      {
        assignmentId: assignmentIdOf(user),
        id: roleNumericId(user.role_id),
        name: roleApiName(user.role_id, role?.name ?? ''),
        isSystem: isAdmin(user),
        warehouse: null,
      },
    ],
    joinedAt: user.created_at,
    createdAt: user.created_at,
    updatedAt: user.created_at,
  };
}

function toRoleDto(role: RoleRow) {
  const system = role.id === 'role-admin';
  return {
    id: roleNumericId(role.id),
    name: roleApiName(role.id, role.name),
    description: role.description ?? null,
    isSystem: system,
    // The Owner holds every permission, whatever the seed says.
    permissions: system ? [...PERMISSIONS] : role.permissions,
    assignmentCount: users.filter((user) => user.role_id === role.id).length,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

const findRoleByNumericId = (id: number) => roles.find((role) => roleNumericId(role.id) === id);

/** The user of the caller's organization with this API id, or undefined (other organizations do not exist for the caller). */
function findManagedUser(id: string, organizationId: string) {
  return users.find(
    (user) => numericId(user.id) === Number(id) && user.organization_id === organizationId,
  );
}

const activeAdmins = (organizationId: string) =>
  users.filter(
    (user) => user.organization_id === organizationId && isAdmin(user) && user.is_active,
  );

function toInvitationDto(invitation: InvitationRow) {
  const role = findRoleById(invitation.role_id);
  return {
    id: numericId(invitation.token),
    email: invitation.email,
    role: {
      id: roleNumericId(invitation.role_id),
      name: role ? roleApiName(invitation.role_id, role.name) : null,
    },
    warehouseId: null,
    invitedBy: { id: numericId(invitation.invited_by), name: invitation.invited_by },
    expiresAt: invitation.expires_at,
    createdAt: new Date(
      new Date(invitation.expires_at).getTime() - INVITATION_TTL_MS,
    ).toISOString(),
    expired: new Date(invitation.expires_at).getTime() <= Date.now(),
  };
}

const randomToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');

export const usersRoutes: MockRoutes = {
  // ---- USERS ----
  'GET /users': ({ query }) => {
    const auth = authorize('user.read', 'user.manage');
    if (auth.error) return auth.error;

    const search = (query.search ?? '').trim().toLowerCase();
    const status = query.status ?? 'ALL';
    const roleId = query.roleId ? Number(query.roleId) : null;

    const list = users
      .filter((user) => user.organization_id === auth.user.organization_id)
      .filter((user) => !search || `${user.full_name} ${user.email}`.toLowerCase().includes(search))
      .filter((user) => status === 'ALL' || (status === 'ACTIVE') === user.is_active)
      .filter((user) => roleId === null || roleNumericId(user.role_id) === roleId)
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
    return { status: 200, data: list.map(toUserDto) };
  },

  'GET /users/:id': ({ params }) => {
    const auth = authorize('user.read', 'user.manage');
    if (auth.error) return auth.error;
    const user = findManagedUser(params.id, auth.user.organization_id);
    if (!user) return error(404, 'USER_NOT_FOUND', 'User not found');
    return { status: 200, data: toUserDto(user) };
  },

  'PATCH /users/:id': ({ params, body }) => {
    const auth = authorize('user.manage');
    if (auth.error) return auth.error;
    const user = findManagedUser(params.id, auth.user.organization_id);
    if (!user) return error(404, 'USER_NOT_FOUND', 'User not found');
    if (isAdmin(user) && !isAdmin(auth.user) && user.id !== auth.user.id) {
      return error(403, 'FORBIDDEN', 'Only administrators can change another administrator');
    }

    const input = (body ?? {}) as { jobTitle?: string | null; departmentId?: number | null };
    if ('departmentId' in input) {
      if (input.departmentId === null) {
        user.area_id = '';
      } else {
        const area = areas.find((row) => numericId(row.id) === input.departmentId);
        if (!area || area.is_active === false) {
          return error(404, 'DEPARTMENT_NOT_FOUND', 'Department not found or inactive');
        }
        user.area_id = area.id;
      }
    }
    if ('jobTitle' in input) user.job_title = input.jobTitle?.trim() || null;
    persistUsers();
    return { status: 200, data: toUserDto(user) };
  },

  'POST /users/:id/role-assignments': ({ params, body }) => {
    const auth = authorize('user.manage');
    if (auth.error) return auth.error;
    const user = findManagedUser(params.id, auth.user.organization_id);
    if (!user) return error(404, 'USER_NOT_FOUND', 'User not found');

    const input = (body ?? {}) as { roleId?: number; warehouseId?: number };
    const role = findRoleByNumericId(Number(input.roleId));
    if (!role) return error(400, 'ROLE_NOT_FOUND', 'Role not found');
    const system = role.id === 'role-admin';
    if (system !== (input.warehouseId === undefined)) {
      return error(
        400,
        'ASSIGNMENT_SCOPE_INVALID',
        'System roles (Owner) apply to every warehouse; every other role needs a warehouse',
      );
    }
    if (system && !isAdmin(auth.user)) {
      return error(403, 'FORBIDDEN', 'Only an Owner grants the Owner role');
    }
    if (user.role_id === role.id) {
      return error(409, 'DUPLICATE_ROLE_ASSIGNMENT', 'The user already has this role');
    }
    if (isAdmin(user) && activeAdmins(user.organization_id).length <= 1) {
      return error(409, 'LAST_OWNER', 'The organization must keep at least one active Owner');
    }

    user.role_id = role.id;
    persistUsers();
    return { status: 201, data: toUserDto(user) };
  },

  'DELETE /users/:id/role-assignments/:assignmentId': ({ params }) => {
    const auth = authorize('user.manage');
    if (auth.error) return auth.error;
    const user = findManagedUser(params.id, auth.user.organization_id);
    if (!user) return error(404, 'USER_NOT_FOUND', 'User not found');
    // The mock holds a single role: only that one can be removed, and it cannot be the last Owner.
    if (Number(params.assignmentId) === assignmentIdOf(user) && isAdmin(user)) {
      if (activeAdmins(user.organization_id).length <= 1) {
        return error(409, 'LAST_OWNER', 'The organization must keep at least one active Owner');
      }
    }
    return { status: 200, data: toUserDto(user) };
  },

  'POST /users/:id/deactivate': ({ params }) => {
    const auth = authorize('user.manage');
    if (auth.error) return auth.error;
    const user = findManagedUser(params.id, auth.user.organization_id);
    if (!user) return error(404, 'USER_NOT_FOUND', 'User not found');
    if (user.id === auth.user.id) {
      return error(409, 'SELF_DEACTIVATION', 'You cannot deactivate your own user');
    }
    if (isAdmin(user) && user.is_active && activeAdmins(user.organization_id).length <= 1) {
      return error(409, 'LAST_OWNER', 'The organization must keep at least one active Owner');
    }
    user.is_active = false;
    persistUsers();
    return { status: 200, data: toUserDto(user) };
  },

  'POST /users/:id/activate': ({ params }) => {
    const auth = authorize('user.manage');
    if (auth.error) return auth.error;
    const user = findManagedUser(params.id, auth.user.organization_id);
    if (!user) return error(404, 'USER_NOT_FOUND', 'User not found');
    user.is_active = true;
    persistUsers();
    return { status: 200, data: toUserDto(user) };
  },

  // ---- ROLES ----
  'GET /roles': () => {
    const auth = authorize('role.read', 'role.manage');
    if (auth.error) return auth.error;
    // System roles first, then by name.
    const list = [...roles].sort(
      (a, b) =>
        Number(b.id === 'role-admin') - Number(a.id === 'role-admin') ||
        a.name.localeCompare(b.name),
    );
    return { status: 200, data: list.map(toRoleDto) };
  },

  'PATCH /roles/:id': ({ params, body }) => {
    const auth = authorize('role.manage');
    if (auth.error) return auth.error;
    const role = findRoleByNumericId(Number(params.id));
    if (!role) return error(404, 'ROLE_NOT_FOUND', 'Role not found');
    if (role.id === 'role-admin') {
      return error(409, 'ROLE_SYSTEM_LOCKED', 'System roles cannot be changed');
    }
    if (role.id === auth.user.role_id) {
      return error(403, 'ROLE_HELD_BY_YOU', 'You cannot edit a role you hold');
    }

    const input = (body ?? {}) as { permissions?: string[] };
    if (input.permissions) {
      if (input.permissions.some((code) => !(PERMISSIONS as readonly string[]).includes(code))) {
        return error(400, 'PERMISSION_NOT_FOUND', 'Permission not found');
      }
      role.permissions = input.permissions as Permission[];
      persistRoles();
    }
    return { status: 200, data: toRoleDto(role) };
  },

  // ---- INVITATIONS ----
  'GET /invitations': () => {
    const auth = authorize('user.read', 'user.manage');
    if (auth.error) return auth.error;
    const pending = invitations.filter(
      (invitation) => !invitation.used && invitation.organization_id === auth.user.organization_id,
    );
    return { status: 200, data: pending.map(toInvitationDto) };
  },

  'POST /invitations': ({ body }) => {
    const auth = authorize('user.manage');
    if (auth.error) return auth.error;

    const input = (body ?? {}) as { email?: string; roleId?: number };
    const email = (input.email ?? '').trim().toLowerCase();
    const role = findRoleByNumericId(Number(input.roleId));
    if (!role) return error(400, 'ROLE_NOT_FOUND', 'Role not found');
    if (role.id === 'role-admin' && !isAdmin(auth.user)) {
      return error(403, 'FORBIDDEN', 'Only administrators can grant a system role');
    }
    const member = findUserByEmail(email);
    if (member?.organization_id === auth.user.organization_id) {
      return error(409, 'ALREADY_MEMBER', 'This person already belongs to the organization');
    }

    // Inviting an email that already has a pending invitation replaces it.
    for (let i = invitations.length - 1; i >= 0; i--) {
      const existing = invitations[i];
      if (
        existing &&
        existing.email === email &&
        existing.organization_id === auth.user.organization_id &&
        !existing.used
      ) {
        invitations.splice(i, 1);
      }
    }
    const invitation: InvitationRow = {
      token: randomToken(),
      email,
      organization_id: auth.user.organization_id,
      role_id: role.id,
      area_id: areas[0]?.id ?? '',
      invited_by: auth.user.full_name,
      expires_at: new Date(Date.now() + INVITATION_TTL_MS).toISOString(),
      used: false,
    };
    invitations.push(invitation);
    console.info(
      `[mock] Invitación para ${email}: ${location.origin}/invitations/accept?token=${invitation.token}`,
    );
    return { status: 201, data: toInvitationDto(invitation) };
  },

  'DELETE /invitations/:id': ({ params }) => {
    const auth = authorize('user.manage');
    if (auth.error) return auth.error;
    const index = invitations.findIndex(
      (invitation) =>
        !invitation.used &&
        invitation.organization_id === auth.user.organization_id &&
        numericId(invitation.token) === Number(params.id),
    );
    if (index === -1) return error(404, 'INVITATION_NOT_FOUND', 'Invitation not found');
    invitations.splice(index, 1);
    return { status: 204 };
  },
};
