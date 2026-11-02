import type { Permission } from '@/core/auth/user';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  areaId: string;
  areaName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface ManagedRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  usersCount: number;
}

export interface ManagedArea {
  id: string;
  name: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  roleId: string;
  areaId: string;
  password?: string;
}

export interface UpdateUserInput {
  id: string;
  name: string;
  email: string;
  roleId: string;
  areaId: string;
  isActive: boolean;
  password?: string;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface UpdateRoleInput {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
}
