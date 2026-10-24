import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { RequireAuth, RequirePermission } from '../core/auth/guards';
import { page } from './load';

import type { Permission } from '@/core/auth/user';
import type { LazyPage } from './load';
import type { RouteObject } from 'react-router-dom';
import { AppLayout } from '@/shared/layout/AppLayout';

const guarded = (path: string, anyOf: Permission[], Page: LazyPage): RouteObject => ({
  element: <RequirePermission anyOf={anyOf} />,
  children: [{ path, element: page({ Page }) }],
});

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const ProductPage = lazy(() => import('@/features/products/pages/ProductPage'));
const WarehousesPage = lazy(() => import('@/features/warehouses/pages/WarehousesPage'));
const InventoryPage = lazy(() => import('@/features/inventory/pages/InventoryPage'));
const RequestsPage = lazy(() => import('@/features/requests/pages/RequestsPage'));
const MovementsPage = lazy(() => Promise.resolve({ default: () => <div>Movements</div> }));
const ImportHistoryPage = lazy(() => Promise.resolve({ default: () => <div>Import History</div> }));
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'));
const BitacoraPage = lazy(() => Promise.resolve({ default: () => <div>Bitacora</div> }));
const ForecastPage = lazy(() => import('@/features/forecast/pages/ForecastPage'));
const SuppliersPage = lazy(() => import('@/features/suppliers/pages/SuppliersPage'));
const AlertsPage = lazy(() => import('@/features/alerts/pages/AlertsPage'));

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
        {
          element: <AppLayout />,
          children: [
            { index: true, element: page({ Page: DashboardPage }) },
            guarded('/products', ['products:manage'], ProductPage),
            guarded('/warehouses', ['warehouses:manage'], WarehousesPage),
            guarded('/inventory', [], InventoryPage),
            guarded('/requests', [], RequestsPage),
            guarded('/movements', [], MovementsPage),
            guarded('/import-history', [], ImportHistoryPage),
            guarded('/users', ['users:manage'], UsersPage),
            guarded('/loggbook', [], BitacoraPage),
            guarded('/forecast', [], ForecastPage),
            guarded('/suppliers', [], SuppliersPage),
            guarded('/alerts', [], AlertsPage),
          ],
        },
      ],
    },
    /* Invalide Route */
  ],
  { future: { v7_startTransition: true } },
);
