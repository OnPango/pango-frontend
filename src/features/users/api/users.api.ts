import { http } from '@/core/api';
import type { Permission } from '@/core/auth/user';
import type {
  CreateRoleInput,
  CreateUserInput,
  ManagedArea,
  ManagedRole,
  ManagedUser,
  UpdateRoleInput,
  UpdateUserInput,
} from '../types/users.types';

interface ManagedUserDto {
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

interface ManagedRoleDto {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  users_count: number;
}

interface ManagedAreaDto {
  id: string;
  name: string;
}

function toManagedUser(dto: ManagedUserDto): ManagedUser {
  return {
    id: dto.id,
    name: dto.full_name,
    email: dto.email,
    roleId: dto.role.id,
    roleName: dto.role.name,
    areaId: dto.area.id,
    areaName: dto.area.name,
    isActive: dto.is_active,
    lastLoginAt: dto.last_login_at,
    createdAt: dto.created_at,
  };
}

function toManagedRole(dto: ManagedRoleDto): ManagedRole {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? '',
    permissions: dto.permissions,
    usersCount: dto.users_count ?? 0,
  };
}

function toManagedArea(dto: ManagedAreaDto): ManagedArea {
  return {
    id: dto.id,
    name: dto.name,
  };
}

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
  const { data } = await http.post<ManagedUserDto>('/users', {
    full_name: input.name,
    email: input.email,
    role_id: input.roleId,
    area_id: input.areaId,
    password: input.password,
  });
  return toManagedUser(data);
}

export async function updateUser(input: UpdateUserInput): Promise<ManagedUser> {
  const { data } = await http.put<ManagedUserDto>(`/users/${input.id}`, {
    full_name: input.name,
    email: input.email,
    role_id: input.roleId,
    area_id: input.areaId,
    is_active: input.isActive,
    password: input.password,
  });
  return toManagedUser(data);
}

export async function toggleUserStatus(id: string, isActive: boolean): Promise<ManagedUser> {
  const { data } = await http.patch<ManagedUserDto>(`/users/${id}/status`, {
    is_active: isActive,
  });
  return toManagedUser(data);
}

// ---- ROLES ----
export async function getRoles(): Promise<ManagedRole[]> {
  const { data } = await http.get<ManagedRoleDto[]>('/roles');
  return data.map(toManagedRole);
}

export async function createRole(input: CreateRoleInput): Promise<ManagedRole> {
  const { data } = await http.post<ManagedRoleDto>('/roles', {
    name: input.name,
    description: input.description,
    permissions: input.permissions,
  });
  return toManagedRole(data);
}

export async function updateRole(input: UpdateRoleInput): Promise<ManagedRole> {
  const { data } = await http.put<ManagedRoleDto>(`/roles/${input.id}`, {
    name: input.name,
    description: input.description,
    permissions: input.permissions,
  });
  return toManagedRole(data);
}

// ---- ÁREAS ----
export async function getAreas(): Promise<ManagedArea[]> {
  const { data } = await http.get<ManagedAreaDto[]>('/areas');
  return data.map(toManagedArea);
}
