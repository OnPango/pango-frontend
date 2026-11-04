import { isAxiosError, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/core/auth/auth.store';
import { refreshSession } from '@/core/auth/session.api';
import { createApiClient } from './client';

/** Marks a request that was already retried after refreshing the session. */
interface RetriableConfig extends AxiosRequestConfig {
  _retried?: boolean;
}

/**
 * Client for everything that needs a signed-in user: it sends `Authorization: Bearer <access token>`.
 * When the API answers 401 (the 15-minute access token expired) it renews the session once with the
 * refresh token and repeats the request; if that fails the local session is dropped and the guards
 * send the user to /login.
 */
export const http = createApiClient();

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!isAxiosError(error) || error.response?.status !== 401 || !error.config) {
      return Promise.reject(error);
    }
    const config = error.config as RetriableConfig;
    if (config._retried) return Promise.reject(error);

    const renewed = await refreshSession();
    if (!renewed) {
      useAuthStore.getState().clearSession();
      return Promise.reject(error);
    }
    config._retried = true;
    return http.request(config);
  },
);
