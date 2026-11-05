import { http } from '@/core/api/http';
import type {
  InviteUserInput,
  ManagedUser,
  PendingInvitation,
  SetUserRolesInput,
  UpdateUserInput,
  WarehouseOption,
} from '../types/users.types';
import type { PendingInvitationDto, UserDto, WarehouseDto } from './users.dto';
import {
  toCreateInvitationDto,
  toManagedUser,
  toPendingInvitation,
  toSetUserRolesDto,
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

/** `PATCH /users/:id`: job title (the department has no list to choose from yet). */
export async function updateUser(input: UpdateUserInput): Promise<ManagedUser> {
  const { data } = await http.patch<UserDto>(`/users/${input.id}`, toUpdateUserDto(input));
  return toManagedUser(data);
}

/** `PUT /users/:id/roles`: replaces every role assignment of the user. */
export async function setUserRoles(input: SetUserRolesInput): Promise<ManagedUser> {
  const { data } = await http.put<UserDto>(`/users/${input.id}/roles`, toSetUserRolesDto(input));
  return toManagedUser(data);
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
