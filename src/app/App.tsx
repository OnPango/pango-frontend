import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1, // Retry up to 2 times on failure
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchInterval: false, // Don't refetch at fixed intervals
    },
    mutations: {
      retry: 0, // Retry mutations up to 0 times
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
