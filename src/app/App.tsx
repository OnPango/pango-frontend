import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { isClientError } from '@/core/api/errors';
import { useAuthStore } from '@/core/auth/auth.store';
import { BootScreen } from '@/shared/boot/BootScreen';
import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // One more try for network failures and 5xx; a 4xx (not found, forbidden…) will not change.
      retry: (failureCount, error) => failureCount < 1 && !isClientError(error),
      refetchOnWindowFocus: false,
      refetchInterval: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Cached data belongs to the user who fetched it. Whatever ends the session (logout, or a 401 from
 * the interceptor), the cache is dropped, so the next user never sees the previous one's data.
 */
useAuthStore.subscribe((state, previous) => {
  if (state.status === 'anonymous' && previous.status !== 'anonymous') queryClient.clear();
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <BootScreen />
    </QueryClientProvider>
  );
}
