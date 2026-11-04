import axios from 'axios';
import { env } from '@/core/config/env';
import { getCurrentTenant } from '@/core/tenant/tenant';

/**
 * Axios instance with the settings every call shares. The access token travels as a Bearer
 * header; the refresh token is an HttpOnly cookie JS cannot read, which the browser only attaches
 * to `/auth/*` and only if the request is made `withCredentials` (`authHttp` does, `http` does not).
 * Each call tells the API which organization it targets through `X-Tenant`, unless the caller
 * already set one (e.g. signing up, from the main domain, an organization that does not exist yet).
 */
export function createApiClient({ withCredentials = false } = {}) {
  const client = axios.create({
    baseURL: env.apiBaseUrl,
    timeout: 15000,
    withCredentials,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    const tenant = getCurrentTenant();
    if (tenant && !config.headers.has('X-Tenant')) config.headers.set('X-Tenant', tenant);
    return config;
  });

  return client;
}
