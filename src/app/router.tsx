import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { RequireAuth, RequirePermission } from '../core/auth/guards';
import { page } from './load';

import type { Permission } from '../core/auth/permissions';
import type { LazyPage } from './load';
import type { RouteObject } from 'react-router-dom';

const guarded = (path: string, anyOf: Permission[], Page: LazyPage): RouteObject => ({
  element: <RequirePermission anyOf={anyOf} />,
  children: [{ path, element: page({ Page }) }],
});

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const DashboardPage = lazy(() => Promise.resolve({ default: () => <div>Dashboard</div> }));

//Example Page:
const WarehousesPage = lazy(() => Promise.resolve({ default: () => <div>Warehouses</div> }));

export const router = createBrowserRouter(
  [
    {
      path: '*',
      element: page({
        Page: lazy(() => Promise.resolve({ default: () => <div>Route not found</div> })),
      }),
    },
    { path: '/login', element: page({ Page: LoginPage }) },
    /* Implementation example */
    {
      element: <RequireAuth />,
      children: [
        { index: true, element: page({ Page: DashboardPage }) },
        guarded('/warehouses', [], WarehousesPage),
      ],
    },
    /* Invalide Route */
  ],
  { future: { v7_startTransition: true } },
);
