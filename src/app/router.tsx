import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { RequireAuth, RequireGuest, RequirePermission } from '../core/auth/guards';
import { page } from './load';
import { APP_ROUTES, NAV_SECTIONS, type AppRoute } from './routes';
import { SessionCheck } from './SessionCheck';

import type { RouteObject } from 'react-router-dom';
import { ForbiddenPage } from '@/fallbacks/error-pages/ForbiddenPage';
import { NotFoundPage } from '@/fallbacks/error-pages/NotFoundPage';
import { RouteErrorPage } from '@/fallbacks/error-pages/RouteErrorPage';
import { AlertsBell } from '@/features/alerts/components/AlertsBell';
import { AppLayout } from '@/shared/layout/AppLayout';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const VerifyEmailPage = lazy(() => import('@/features/auth/pages/VerifyEmailPage'));
const AcceptInvitationPage = lazy(() => import('@/features/auth/pages/AcceptInvitationPage'));

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
        {
          element: <RequireGuest loadingFallback={<SessionCheck />} />,
          children: [
            { path: '/login', element: page({ Page: LoginPage }) },
            { path: '/register', element: page({ Page: RegisterPage }) },
          ],
        },
        // Opened from an email: reachable whether or not someone is already signed in.
        { path: '/verify-email', element: page({ Page: VerifyEmailPage }) },
        { path: '/invitations/accept', element: page({ Page: AcceptInvitationPage }) },
        {
          element: <RequireAuth loadingFallback={<SessionCheck />} />,
          children: [
            {
              element: <AppLayout navSections={NAV_SECTIONS} headerActions={<AlertsBell />} />,
              // An unknown address is answered inside the app, with the header and the menu at hand.
              // Signed out, it goes through the login first and comes back here.
              children: [...APP_ROUTES.map(toRoute), { path: '*', element: <NotFoundPage /> }],
            },
          ],
        },
      ],
    },
  ],
  { future: { v7_startTransition: true } },
);
