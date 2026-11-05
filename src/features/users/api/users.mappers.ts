import type {
  CreateRoleInput,
  CreateUserInput,
  ManagedArea,
  ManagedRole,
  ManagedUser,
  UpdateRoleInput,
  UpdateUserInput,
} from '../types/users.types';
import type {
  CreateUserDto,
  ManagedAreaDto,
  ManagedRoleDto,
  ManagedUserDto,
  RoleBodyDto,
  UpdateUserDto,
  UserStatusDto,
} from './users.dto';

// ---- Responses → domain ----

export function toManagedUser(dto: ManagedUserDto): ManagedUser {
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

export function toManagedRole(dto: ManagedRoleDto): ManagedRole {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? '',
    permissions: dto.permissions,
    usersCount: dto.users_count ?? 0,
  };
}

export function toManagedArea(dto: ManagedAreaDto): ManagedArea {
  return {
    id: dto.id,
    name: dto.name,
  };
}

// ---- Domain → requests ----

export function toCreateUserDto(input: CreateUserInput): CreateUserDto {
  return {
    full_name: input.name,
    email: input.email,
    role_id: input.roleId,
    area_id: input.areaId,
    password: input.password,
  };
}

export function toUpdateUserDto(input: UpdateUserInput): UpdateUserDto {
  return {
    ...toCreateUserDto(input),
    is_active: input.isActive,
  };
}

export const toUserStatusDto = (isActive: boolean): UserStatusDto => ({ is_active: isActive });

export function toRoleBodyDto(input: CreateRoleInput | UpdateRoleInput): RoleBodyDto {
  return {
    name: input.name,
    description: input.description,
    permissions: input.permissions,
  };
}
