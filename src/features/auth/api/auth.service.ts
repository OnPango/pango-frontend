import { http } from '@/core/api';
import { toUser } from '@/core/auth/user.mappers';
import type { User } from '@/core/auth/user';
import type { LoginRequest, LoginResponseDto } from '../types/auth';

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
