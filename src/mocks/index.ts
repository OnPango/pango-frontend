import { http } from '@/core/api';
import { authRoutes } from './handlers/auth.handlers';
import { usersRoutes } from './handlers/users.handlers';
import { createMockAdapter } from './server';

/**
 * Replaces the network layer of the shared Axios instance with the mock backend.
 * Called from `main.tsx` only when `VITE_USE_MOCK=true`; loaded with a dynamic import,
 * so this code is a separate chunk that is never downloaded otherwise.
 *
 * To mock a new module: add `src/mocks/handlers/<module>.handlers.ts` and spread it here.
 */
export function enableMocking(): void {
  http.defaults.adapter = createMockAdapter({
    ...authRoutes,
    ...usersRoutes,
  });
  console.info('[mock] Backend simulado activo (VITE_USE_MOCK=true).');
}
