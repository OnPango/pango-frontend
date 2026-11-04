import { useMutation } from '@tanstack/react-query';
import { login } from '@/core/auth/auth.api';
import type { LoginDto } from '@/core/auth/auth.dto';
import { applySession } from '@/core/auth/session.api';

/** Login mutation: on success the session (tokens + user) is started. */
export function useLogin() {
  return useMutation({
    mutationFn: (credentials: LoginDto) => login(credentials),
    onSuccess: (session) => applySession(session),
  });
}
