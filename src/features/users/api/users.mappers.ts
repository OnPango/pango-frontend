import { PERMISSIONS, type Permission } from '@/core/auth/user';
import type {
  InviteUserInput,
  ManagedRole,
  ManagedUser,
  PendingInvitation,
  RoleAssignment,
  RoleAssignmentInput,
  UpdateRolePermissionsInput,
  UpdateUserInput,
  WarehouseOption,
} from '../types/users.types';
import type {
  AddRoleAssignmentDto,
  CreateInvitationDto,
  PendingInvitationDto,
  RoleDto,
  UpdateRoleDto,
  UpdateUserDto,
  UserDto,
  UserRoleDto,
  WarehouseDto,
} from './users.dto';

// ---- Responses → domain ----

const toRoleAssignment = (dto: UserRoleDto): RoleAssignment => ({
  assignmentId: String(dto.assignmentId),
  roleId: String(dto.id),
  roleName: dto.name,
  isSystem: dto.isSystem,
  warehouse: dto.warehouse ? { id: String(dto.warehouse.id), name: dto.warehouse.name } : null,
});

export const toManagedUser = (dto: UserDto): ManagedUser => ({
  id: String(dto.id),
  name: dto.name,
  email: dto.email,
  jobTitle: dto.jobTitle,
  department: dto.department ? { id: String(dto.department.id), name: dto.department.name } : null,
  isActive: dto.isActive,
  isOwner: dto.isOwner,
  roles: dto.roles.map(toRoleAssignment),
  joinedAt: dto.joinedAt,
  createdAt: dto.createdAt,
});

export const toPendingInvitation = (dto: PendingInvitationDto): PendingInvitation => ({
  id: String(dto.id),
  email: dto.email,
  roleId: String(dto.role.id),
  roleName: dto.role.name ?? '',
  warehouseId: dto.warehouseId === null ? null : String(dto.warehouseId),
  invitedBy: dto.invitedBy.name,
  expiresAt: dto.expiresAt,
  createdAt: dto.createdAt,
  expired: dto.expired,
});

export const toWarehouseOption = (dto: WarehouseDto): WarehouseOption => ({
  id: String(dto.id),
  name: dto.name,
});

const isPermission = (code: string): code is Permission =>
  (PERMISSIONS as readonly string[]).includes(code);

export const toManagedRole = (dto: RoleDto): ManagedRole => ({
  id: String(dto.id),
  name: dto.name,
  description: dto.description,
  isSystem: dto.isSystem,
  // Unknown codes (a newer backend) are discarded instead of breaking the screen.
  permissions: dto.permissions.filter(isPermission),
  assignmentCount: dto.assignmentCount,
});

// ---- Domain → request bodies ----

export const toUpdateRoleDto = (input: UpdateRolePermissionsInput): UpdateRoleDto => ({
  permissions: input.permissions,
});

export const toUpdateUserDto = (input: UpdateUserInput): UpdateUserDto => ({
  ...(input.jobTitle !== undefined ? { jobTitle: input.jobTitle?.trim() || null } : {}),
  ...(input.departmentId !== undefined
    ? { departmentId: input.departmentId === null ? null : Number(input.departmentId) }
    : {}),
});

export const toAddRoleAssignmentDto = (input: RoleAssignmentInput): AddRoleAssignmentDto => ({
  roleId: Number(input.roleId),
  ...(input.warehouseId ? { warehouseId: Number(input.warehouseId) } : {}),
});

export const toCreateInvitationDto = (input: InviteUserInput): CreateInvitationDto => ({
  email: input.email.trim().toLowerCase(),
  roleId: Number(input.roleId),
  ...(input.warehouseId ? { warehouseId: Number(input.warehouseId) } : {}),
});
