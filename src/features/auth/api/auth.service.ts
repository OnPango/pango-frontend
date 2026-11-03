import { http } from '@/core/api';
import { toUser } from '@/core/auth/user.mappers';
import type { User } from '@/core/auth/user';
import type {
  LoginRequest,
  LoginResponseDto,
  RegisterOrganizationRequest,
  WorkspaceAvailabilityDto,
} from '../types/auth';
import { toRegisterOrganizationDto } from './auth.mappers';

/**
 * `POST /auth/login`. On success the backend sets the session cookie and returns the user.
 * In mock mode (`VITE_USE_MOCK=true`) the same request is answered by `src/mocks`.
 */
export async function login(credentials: LoginRequest): Promise<User> {
  const { data } = await http.post<LoginResponseDto>('/auth/login', {
    email: credentials.email.trim().toLowerCase(),
    password: credentials.password,
  });
  return toUser(data.user);
}

/**
 * `POST /auth/register` (CU-13). Creates the organization, its isolated workspace and its first
 * administrator. It does not sign anyone in: the user goes to the login screen afterwards.
 * Rejects with 409 if the workspace address, the tax id or the email is already registered,
 * 422 if required fields are missing.
 */
export async function registerOrganization(request: RegisterOrganizationRequest): Promise<void> {
  await http.post('/auth/register', toRegisterOrganizationDto(request));
}

/** `GET /auth/workspaces/:slug/availability`: is `<slug>.onpango.com` free? */
export async function checkWorkspaceAvailability(
  slug: string,
  signal?: AbortSignal,
): Promise<boolean> {
  const { data } = await http.get<WorkspaceAvailabilityDto>(
    `/auth/workspaces/${encodeURIComponent(slug)}/availability`,
    { signal },
  );
  return data.available;
}
