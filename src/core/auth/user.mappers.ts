import { PERMISSIONS, type Permission, type User } from './user';

/**
 * User as the backend sends it. Only this file and the API functions know this shape;
 * the rest of the app uses `User`. If the contract changes, adjust it here.
 */
export interface UserDto {
  id: string;
  full_name: string;
  email: string;
  role: {
    id: string;
    name: string;
    permissions: string[];
  };
  area_id: string;
  organization_id: string;
}

/** Response body of `POST /auth/login` and `GET /auth/me`. The token travels in an httpOnly cookie. */
export interface SessionResponseDto {
  user: UserDto;
}

const isPermission = (value: string): value is Permission =>
  (PERMISSIONS as readonly string[]).includes(value);

export function toUser(dto: UserDto): User {
  return {
    id: dto.id,
    name: dto.full_name,
    email: dto.email,
    roleName: dto.role.name,
    areaId: dto.area_id,
    organizationId: dto.organization_id,
    permissions: dto.role.permissions.filter(isPermission),
  };
}
