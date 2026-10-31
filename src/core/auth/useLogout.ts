import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from './auth.store';
import { logoutRequest } from './session.api';

/**
 * Logs out on the backend and always clears the local session, even if the request fails
 * (the user asked to leave; a stale cookie will be rejected with 401 anyway).
 * Dropping the query cache is not done here: `app/App.tsx` does it whenever the session ends.
 */
export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession);

  const mutation = useMutation({
    mutationFn: logoutRequest,
    onSettled: clearSession,
  });

  return { logout: () => mutation.mutate(), isLoggingOut: mutation.isPending };
}
