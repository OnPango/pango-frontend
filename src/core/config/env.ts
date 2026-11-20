export const env = {
  /**
   * Base URL of the Pango API (no trailing slash). In development `/api`: the Vite proxy forwards it
   * to pango-core so the session cookies are same-origin. In production the API's full URL.
   */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, ''),
  /** Domain organizations hang from: `<subdomain>.<appBaseDomain>` (production: `onpango.com`). */
  appBaseDomain: (import.meta.env.VITE_APP_BASE_DOMAIN ?? 'localhost').toLowerCase(),
  /**
   * Pins the organization instead of reading it from the hostname. For development on a single
   * host (`localhost:5173`) and for the mock backend, where subdomains are not available.
   */
  devTenant: (import.meta.env.VITE_DEV_TENANT ?? '').toLowerCase() || null,
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
} as const;
