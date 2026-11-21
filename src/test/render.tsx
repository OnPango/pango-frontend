import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/** A fresh cache per test, without retries: a failed request shows its error at once. */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

/** Renders `ui` with the app's providers (React Query and a router) and a `userEvent` session. */
export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return { user: userEvent.setup(), queryClient, ...render(ui, { wrapper }) };
}
