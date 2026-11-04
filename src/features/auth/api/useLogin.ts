import { useMutation } from '@tanstack/react-query';
import { applySession } from '@/core/auth/session.api';
import type { LoginRequest } from '../types/auth';
import { login } from './auth.service';

/** Login mutation: on success the session (tokens + user) is started. */
export function useLogin() {
  return useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: (session) => applySession(session),
  });
}
