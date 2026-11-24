import { authHttp } from '@/core/api/authHttp';
import { http } from '@/core/api/http';
import { alertsRoutes } from './handlers/alerts.handlers';
import { authRoutes } from './handlers/auth.handlers';
import { catalogRoutes } from './handlers/catalog.handlers';
import { dashboardRoutes } from './handlers/dashboard.handlers';
import { departmentsRoutes } from './handlers/departments.handlers';
import { forecastingRoutes } from './handlers/forecasting.handlers';
import { importsRoutes } from './handlers/imports.handlers';
import { movementsRoutes } from './handlers/movements.handlers';
import { organizationsRoutes } from './handlers/organizations.handlers';
import { replenishmentRoutes } from './handlers/replenishment.handlers';
import { searchRoutes } from './handlers/search.handlers';
import { stockRoutes } from './handlers/stock.handlers';
import { stockRequestsRoutes } from './handlers/stock-requests.handlers';
import { usersRoutes } from './handlers/users.handlers';
import { warehousesRoutes } from './handlers/warehouses.handlers';
import { createMockAdapter } from './server';

/**
 * Replaces the network layer of both Axios clients (`http` and `authHttp`) with the mock backend.
 * Called from `main.tsx` only when `VITE_USE_MOCK=true`; loaded with a dynamic import,
 * so this code is a separate chunk that is never downloaded otherwise.
 *
 * To mock a new module: add `src/mocks/handlers/<module>.handlers.ts` and spread it here.
 */
export function enableMocking(): void {
  const adapter = createMockAdapter({
    ...authRoutes,
    ...usersRoutes,
    ...catalogRoutes,
    ...warehousesRoutes,
    ...movementsRoutes,
    ...replenishmentRoutes,
    ...stockRoutes,
    ...organizationsRoutes,
    ...departmentsRoutes,
    ...stockRequestsRoutes,
    ...alertsRoutes,
    ...forecastingRoutes,
    ...searchRoutes,
    ...dashboardRoutes,
    ...importsRoutes,
  });
  http.defaults.adapter = adapter;
  authHttp.defaults.adapter = adapter;
  console.info('[mock] Backend simulado activo (VITE_USE_MOCK=true).');
}
