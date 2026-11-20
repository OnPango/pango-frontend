import { http } from '@/core/api/http';
import type {
  ChangeUserRolesInput,
  CreateRoleInput,
  DepartmentOption,
  InviteUserInput,
  ManagedRole,
  ManagedUser,
  PendingInvitation,
  UpdateRoleDetailsInput,
  UpdateRolePermissionsInput,
  UpdateUserInput,
  WarehouseOption,
} from '../types/users.types';
import type {
  DepartmentDto,
  PendingInvitationDto,
  RoleDto,
  UserDto,
  WarehouseDto,
} from './users.dto';
import {
  toAddRoleAssignmentDto,
  toCreateInvitationDto,
  toCreateRoleDto,
  toManagedRole,
  toManagedUser,
  toPendingInvitation,
  toUpdateRoleDetailsDto,
  toUpdateRoleDto,
  toUpdateUserDto,
  toWarehouseOption,
} from './users.mappers';

/**
 * Every call to the users, invitations and warehouses endpoints, in one place. They answer with the
 * domain types of `types/users.types.ts`, never with the raw bodies (`users.dto.ts`).
 */

// ---- Users ----

/** `GET /users`: every user, active or not (the page filters). */
export async function getUsers(): Promise<ManagedUser[]> {
  const { data } = await http.get<UserDto[]>('/users', { params: { status: 'ALL' } });
  return data.map(toManagedUser);
}

/** `PATCH /users/:id`: job title and area. */
export async function updateUser(input: UpdateUserInput): Promise<ManagedUser> {
  const { data } = await http.patch<UserDto>(`/users/${input.id}`, toUpdateUserDto(input));
  return toManagedUser(data);
}

/**
 * `POST /users/:id/role-assignments` for each new grant, then `DELETE …/:assignmentId` for each
 * removed one (in that order, so the user always keeps a role). Each call is checked on its own by
 * the API, so a failure leaves the earlier ones applied: the caller refetches.
 */
export async function changeUserRoles(input: ChangeUserRolesInput): Promise<ManagedUser> {
  let user: UserDto | null = null;
  for (const grant of input.add) {
    ({ data: user } = await http.post<UserDto>(
      `/users/${input.id}/role-assignments`,
      toAddRoleAssignmentDto(grant),
    ));
  }
  for (const assignmentId of input.remove) {
    ({ data: user } = await http.delete<UserDto>(
      `/users/${input.id}/role-assignments/${assignmentId}`,
    ));
  }
  if (!user) user = (await http.get<UserDto>(`/users/${input.id}`)).data;
  return toManagedUser(user);
}

/** `POST /users/:id/deactivate` or `/activate` (both idempotent). */
export async function setUserActive(id: string, isActive: boolean): Promise<ManagedUser> {
  const { data } = await http.post<UserDto>(`/users/${id}/${isActive ? 'activate' : 'deactivate'}`);
  return toManagedUser(data);
}

// ---- Invitations ----

/** `GET /invitations`: pending ones, expired included. */
export async function getInvitations(): Promise<PendingInvitation[]> {
  const { data } = await http.get<PendingInvitationDto[]>('/invitations');
  return data.map(toPendingInvitation);
}

/**
 * `POST /invitations`: emails the invitation. Inviting an email that already has a pending one
 * replaces it, which is how an invitation is resent.
 */
export async function inviteUser(input: InviteUserInput): Promise<void> {
  await http.post('/invitations', toCreateInvitationDto(input));
}

/** `DELETE /invitations/:id` */
export async function revokeInvitation(id: string): Promise<void> {
  await http.delete(`/invitations/${id}`);
}

// ---- Warehouses ----

/** `GET /warehouses`: the active warehouses the user can see, to scope a role to one of them. */
export async function getWarehouses(): Promise<WarehouseOption[]> {
  const { data } = await http.get<WarehouseDto[]>('/warehouses');
  return data.filter((warehouse) => warehouse.isActive).map(toWarehouseOption);
}

// ---- Roles ----

/** `GET /roles`: system roles first, then by name. */
export async function getRoles(): Promise<ManagedRole[]> {
  const { data } = await http.get<RoleDto[]>('/roles');
  return data.map(toManagedRole);
}

/** `PATCH /roles/:id`: replaces every permission of the role; it applies to its holders on their next request. */
export async function updateRolePermissions(
  input: UpdateRolePermissionsInput,
): Promise<ManagedRole> {
  const { data } = await http.patch<RoleDto>(`/roles/${input.id}`, toUpdateRoleDto(input));
  return toManagedRole(data);
}

/** `POST /roles`: a role of the organization; it may register every movement type. */
export async function createRole(input: CreateRoleInput): Promise<ManagedRole> {
  const { data } = await http.post<RoleDto>('/roles', toCreateRoleDto(input));
  return toManagedRole(data);
}

/** `PATCH /roles/:id` with the name and description; the permissions stay as they are. */
export async function updateRoleDetails(input: UpdateRoleDetailsInput): Promise<ManagedRole> {
  const { data } = await http.patch<RoleDto>(`/roles/${input.id}`, toUpdateRoleDetailsDto(input));
  return toManagedRole(data);
}

/** `DELETE /roles/:id`: only a role nobody holds and no pending invitation offers. */
export async function deleteRole(id: string): Promise<void> {
  await http.delete(`/roles/${id}`);
}

// ---- Departments ----

/** `GET /departments?status=ALL`: the areas a person can be assigned to (inactive ones only show). */
export async function getDepartmentOptions(): Promise<DepartmentOption[]> {
  const { data } = await http.get<DepartmentDto[]>('/departments', { params: { status: 'ALL' } });
  return data.map((dto) => ({ id: String(dto.id), name: dto.name, isActive: dto.isActive }));
}
