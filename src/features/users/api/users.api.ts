import { http } from '@/core/api';
import type {
  CreateRoleInput,
  CreateUserInput,
  ManagedArea,
  ManagedRole,
  ManagedUser,
  UpdateRoleInput,
  UpdateUserInput,
} from '../types/users.types';
import type { ManagedAreaDto, ManagedRoleDto, ManagedUserDto } from './users.dto';
import {
  toCreateUserDto,
  toManagedArea,
  toManagedRole,
  toManagedUser,
  toRoleBodyDto,
  toUpdateUserDto,
  toUserStatusDto,
} from './users.mappers';

// ---- USUARIOS ----
export async function getUsers(): Promise<ManagedUser[]> {
  const { data } = await http.get<ManagedUserDto[]>('/users');
  return data.map(toManagedUser);
}

export async function getUser(id: string): Promise<ManagedUser> {
  const { data } = await http.get<ManagedUserDto>(`/users/${id}`);
  return toManagedUser(data);
}

export async function createUser(input: CreateUserInput): Promise<ManagedUser> {
  const { data } = await http.post<ManagedUserDto>('/users', toCreateUserDto(input));
  return toManagedUser(data);
}

export async function updateUser(input: UpdateUserInput): Promise<ManagedUser> {
  const { data } = await http.put<ManagedUserDto>(`/users/${input.id}`, toUpdateUserDto(input));
  return toManagedUser(data);
}

export async function toggleUserStatus(id: string, isActive: boolean): Promise<ManagedUser> {
  const { data } = await http.patch<ManagedUserDto>(
    `/users/${id}/status`,
    toUserStatusDto(isActive),
  );
  return toManagedUser(data);
}

// ---- ROLES ----
export async function getRoles(): Promise<ManagedRole[]> {
  const { data } = await http.get<ManagedRoleDto[]>('/roles');
  return data.map(toManagedRole);
}

export async function createRole(input: CreateRoleInput): Promise<ManagedRole> {
  const { data } = await http.post<ManagedRoleDto>('/roles', toRoleBodyDto(input));
  return toManagedRole(data);
}

export async function updateRole(input: UpdateRoleInput): Promise<ManagedRole> {
  const { data } = await http.put<ManagedRoleDto>(`/roles/${input.id}`, toRoleBodyDto(input));
  return toManagedRole(data);
}

// ---- ÁREAS ----
export async function getAreas(): Promise<ManagedArea[]> {
  const { data } = await http.get<ManagedAreaDto[]>('/areas');
  return data.map(toManagedArea);
}
