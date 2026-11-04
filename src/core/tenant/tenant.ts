import { env } from '@/core/config/env';

/**
 * Pango is organization-first: every organization lives on its own subdomain
 * (`mi-empresa.onpango.com`) and the API is told which one a request targets (`X-Tenant`).
 * Mirrors `src/tenancy/subdomain.ts` in pango-core.
 */

/** 2–41 chars: lowercase letters, digits and inner hyphens. */
export const SUBDOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}[a-z0-9]$/;
export const SUBDOMAIN_MAX_LENGTH = 41;

/** Names the platform keeps for itself; an organization cannot take them. */
export const RESERVED_SUBDOMAINS: ReadonlySet<string> = new Set([
  'admin',
  'api',
  'app',
  'assets',
  'auth',
  'cdn',
  'dashboard',
  'docs',
  'help',
  'login',
  'mail',
  'pango',
  'onpango',
  'signup',
  'static',
  'status',
  'support',
  'www',
]);

export const isValidSubdomain = (subdomain: string) =>
  SUBDOMAIN_PATTERN.test(subdomain) && !RESERVED_SUBDOMAINS.has(subdomain);

/** Organization the app is being served for, or `null` on the main domain. */
export function getCurrentTenant(): string | null {
  if (env.devTenant) return env.devTenant;
  const host = window.location.hostname.toLowerCase();
  const suffix = `.${env.appBaseDomain}`;
  if (!host.endsWith(suffix)) return null;
  const label = host.slice(0, -suffix.length);
  return label && !label.includes('.') && !RESERVED_SUBDOMAINS.has(label) ? label : null;
}

function originFor(host: string): string {
  const { protocol, port } = window.location;
  return `${protocol}//${host}${port ? `:${port}` : ''}`;
}

/**
 * Absolute URL of `path` inside an organization. With a pinned dev tenant there is a single
 * host, so it stays relative to the current origin.
 */
export function buildTenantUrl(subdomain: string, path = '/'): string {
  if (env.devTenant) return path;
  return `${originFor(`${subdomain}.${env.appBaseDomain}`)}${path}`;
}

/** URL of `path` on the main domain (where organizations are created and found). */
export function buildMainUrl(path = '/'): string {
  if (env.devTenant) return path;
  return `${originFor(env.appBaseDomain)}${path}`;
}
