export const env = {
  /** Base URL of the Pango API (no trailing slash). */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  /** Domain organizations hang from: `<subdomain>.<appBaseDomain>` (production: `onpango.com`). */
  appBaseDomain: (import.meta.env.VITE_APP_BASE_DOMAIN ?? 'localhost').toLowerCase(),
  /**
   * Pins the organization instead of reading it from the hostname. For development on a single
   * host (`localhost:5173`) and for the mock backend, where subdomains are not available.
   */
  devTenant: (import.meta.env.VITE_DEV_TENANT ?? '').toLowerCase() || null,
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
} as const;
