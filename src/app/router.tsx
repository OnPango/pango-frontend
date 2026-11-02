import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { RequireAuth, RequireGuest, RequirePermission } from '../core/auth/guards';
import { page } from './load';
import { APP_ROUTES, NAV_SECTIONS, type AppRoute } from './routes';

import type { RouteObject } from 'react-router-dom';
import { ForbiddenPage } from '@/fallbacks/error-pages/ForbiddenPage';
import { NotFoundPage } from '@/fallbacks/error-pages/NotFoundPage';
import { RouteErrorPage } from '@/fallbacks/error-pages/RouteErrorPage';
import { AppLayout } from '@/shared/layout/AppLayout';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));

/**
 * One screen of `APP_ROUTES`, behind its permission check. Pages declare their own `errorElement`
 * (instead of the layout doing it) so that a crash replaces only the page: the sidebar and header
 * stay on screen.
 */
const toRoute = ({ path, anyOf, Page }: AppRoute): RouteObject => {
  const element = page({ Page });
  const errorElement = <RouteErrorPage />;

  return {
    element: <RequirePermission anyOf={anyOf} fallback={<ForbiddenPage />} />,
    children: [
      path === '/' ? { index: true, element, errorElement } : { path, element, errorElement },
    ],
  };
};

export const router = createBrowserRouter(
  [
    {
      // Last-resort boundary for what the page routes do not catch (login, layout).
      errorElement: <RouteErrorPage />,
      children: [
        { path: '*', element: <NotFoundPage /> },
        {
          element: <RequireGuest />,
          children: [{ path: '/login', element: page({ Page: LoginPage }) }],
        },
        {
          element: <RequireAuth />,
          children: [
            {
              element: <AppLayout navSections={NAV_SECTIONS} />,
              children: APP_ROUTES.map(toRoute),
            },
          ],
        },
      ],
    },
  ],
  { future: { v7_startTransition: true } },
);
