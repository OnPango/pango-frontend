import axios from 'axios';
import { env } from '@/core/config/env';
import { getCurrentTenant } from '@/core/tenant/tenant';

/**
 * Axios instance with the settings every call shares. The session lives in HttpOnly cookies (access
 * and refresh, one pair per organization) that JavaScript cannot read: the browser attaches them on
 * its own, but only to requests made `withCredentials`, so every call is.
 * Each call tells the API which organization it targets through `X-Tenant`, unless the caller
 * already set one (e.g. signing up, from the main domain, an organization that does not exist yet).
 */
export function createApiClient() {
  const client = axios.create({
    baseURL: env.apiBaseUrl,
    timeout: 15000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    const tenant = getCurrentTenant();
    if (tenant && !config.headers.has('X-Tenant')) config.headers.set('X-Tenant', tenant);
    return config;
  });

  return client;
}
