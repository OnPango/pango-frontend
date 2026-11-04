import { createApiClient } from './client';

/**
 * Client for the endpoints that open, renew or end a session (login, signup, refresh, logout,
 * accept invitation) plus the other public auth calls. It never sends the access token and never
 * tries to refresh it, which keeps the refresh flow from calling itself. It sends credentials so the
 * browser attaches / stores the HttpOnly refresh cookie (CORS allows credentials for Pango origins).
 */
export const authHttp = createApiClient({ withCredentials: true });
