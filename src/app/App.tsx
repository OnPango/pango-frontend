import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from '@/core/auth/auth.store';
import { useEffect } from 'react';

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
  useEffect(() => {
    useAuthStore.setState({
      user: {
        id: '1',
        name: 'Carlos',
        email: 'carlosarango1107@outlook.com',
        roleName: 'Admin',
        areaId: '1',
        organizationId: '1',
        permissions: [
          'dashboard:view',
          'users:manage',
          'warehouses:manage',
          'products:manage',
          'inventory:record',
          'requests:create',
          'requests:attend',
          'suppliers:manage',
          'forecast:view',
          'alerts:view',
          'areas:manage',
        ],
      },
      isAuthenticated: true,
    });
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
