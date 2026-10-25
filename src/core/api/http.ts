import axios from 'axios';
import { env } from '@/core/config/env';
import { useAuthStore } from '@/core/auth/auth.store';

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
  // The session token is an httpOnly cookie set by the backend: the browser attaches it,
  // JS never reads it. Cross-origin, the backend must answer with
  // `Access-Control-Allow-Credentials: true` and an explicit `Access-Control-Allow-Origin`.
  withCredentials: true,
  // CSRF (double-submit cookie): if the backend sets a readable `XSRF-TOKEN` cookie,
  // Axios echoes it in this header on every request.
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    // Expired or invalid cookie: drop the local session; the guards redirect to /login.
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().clearSession();
    }
    return Promise.reject(error);
  },
);

export type ApiResponse<T> = {
  data: T;
  message?: string;
  success?: boolean;
};
