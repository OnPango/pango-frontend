import { isAxiosError, type AxiosRequestConfig } from 'axios';
import { createApiClient } from './client';

/** Marks a request that was already retried after refreshing the session. */
interface RetriableConfig extends AxiosRequestConfig {
  _retried?: boolean;
}

/**
 * What the client needs to know about the session. It is injected (`configureHttpAuth`) instead of
 * imported, so this module knows nothing about how the session is stored or renewed: `core/auth`
 * depends on `core/api`, never the other way around.
 */
export interface HttpAuthHooks {
  /** Renews the session. Resolves `true` when it was renewed and the request can be repeated. */
  refresh: () => Promise<boolean>;
  /** The session could not be renewed: it is over. */
  onSessionExpired: () => void;
}

let authHooks: HttpAuthHooks | null = null;

/** Connects `http` to the session. Call it once at startup, before the first request. */
export function configureHttpAuth(hooks: HttpAuthHooks): void {
  authHooks = hooks;
}

/**
 * Client for everything that needs a signed-in user. Authentication is the access cookie, which the
 * browser attaches by itself. When the API answers 401 (the 15-minute access cookie expired and the
 * browser stopped sending it) it renews the session once and repeats the request; if that fails the
 * session is reported as over and the guards send the user to /login. Without `configureHttpAuth`
 * it behaves like a plain client.
 */
export const http = createApiClient();

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!authHooks || !isAxiosError(error) || error.response?.status !== 401 || !error.config) {
      return Promise.reject(error);
    }
    const config = error.config as RetriableConfig;
    if (config._retried) return Promise.reject(error);

    const renewed = await authHooks.refresh();
    if (!renewed) {
      authHooks.onSessionExpired();
      return Promise.reject(error);
    }
    config._retried = true;
    return http.request(config);
  },
);
