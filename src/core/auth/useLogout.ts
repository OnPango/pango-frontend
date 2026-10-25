import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from './auth.store';
import { logoutRequest } from './session.api';

/**
 * Logs out on the backend and always clears the local session, even if the request fails
 * (the user asked to leave; a stale cookie will be rejected with 401 anyway).
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);

  const mutation = useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      clearSession();
      // Cached data belongs to the previous user.
      queryClient.clear();
    },
  });

  return { logout: () => mutation.mutate(), isLoggingOut: mutation.isPending };
}
