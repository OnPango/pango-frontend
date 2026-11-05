import { createApiClient } from './client';

/**
 * Client for the endpoints that open, renew or end a session (login, signup, refresh, logout,
 * accept invitation) plus the other public auth calls. It never tries to renew the session on a 401,
 * which keeps the refresh flow from calling itself: there a 401 means "wrong credentials" or "no
 * valid session", not "expired access token". Like every client it sends the session cookies.
 */
export const authHttp = createApiClient();
