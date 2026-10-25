import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/core/auth/auth.store';
import { login } from './auth.service';

/** Login mutation: on success the user goes to the store; the cookie is already in the browser. */
export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: login,
    onSuccess: (user) => setSession(user),
  });
}
