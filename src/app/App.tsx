import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/auth.store';
import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
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
    </QueryClientProvider>
  );
}
