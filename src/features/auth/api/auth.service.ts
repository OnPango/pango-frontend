import { http } from '@/core/api';
import { toUser } from '@/core/auth/user.mappers';
import type { User } from '@/core/auth/user';
import type {
  LoginRequest,
  LoginResponseDto,
  RegisterOrganizationDto,
  RegisterOrganizationRequest,
} from '../types/auth';

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
 * `POST /auth/register` (CU-13). Creates the organization, its isolated environment and its first
 * administrator. It does not sign anyone in: the user goes to the login screen afterwards.
 * Rejects with 409 if the tax id or the email is already registered, 422 if fields are missing.
 */
export async function registerOrganization(request: RegisterOrganizationRequest): Promise<void> {
  const body: RegisterOrganizationDto = {
    organization: {
      name: request.organizationName,
      tax_id: request.taxId,
      contact_phone: request.contactPhone,
    },
    admin: {
      full_name: request.adminName,
      email: request.adminEmail.toLowerCase(),
      password: request.password,
    },
  };
  await http.post('/auth/register', body);
}
