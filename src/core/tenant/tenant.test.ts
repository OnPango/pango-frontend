import { describe, expect, it, vi } from 'vitest';
import {
  buildMainUrl,
  buildTenantUrl,
  getCurrentTenant,
  isValidSubdomain,
  slugify,
  tenantFromHostname,
} from './tenant';

// The tests pin VITE_APP_BASE_DOMAIN=onpango.com (vite.config.ts → test.env).
describe('tenantFromHostname', () => {
  it('returns the organization of a subdomain', () => {
    expect(tenantFromHostname('acme.onpango.com')).toBe('acme');
  });

  it('ignores the case of the hostname', () => {
    expect(tenantFromHostname('ACME.OnPango.com')).toBe('acme');
  });

  it('returns null on the main domain', () => {
    expect(tenantFromHostname('onpango.com')).toBeNull();
  });

  it.each(['pango', 'www', 'api', 'app'])('returns null on the reserved name "%s"', (name) => {
    expect(tenantFromHostname(`${name}.onpango.com`)).toBeNull();
  });

  it('returns null on a nested subdomain', () => {
    expect(tenantFromHostname('a.acme.onpango.com')).toBeNull();
  });

  it('returns null on another domain, even one that ends like ours', () => {
    expect(tenantFromHostname('acme.example.com')).toBeNull();
    expect(tenantFromHostname('acme.notonpango.com')).toBeNull();
  });
});

describe('getCurrentTenant', () => {
  it('reads the organization from the current hostname when no dev tenant is pinned', () => {
    // jsdom serves the tests from `localhost`, which is not under onpango.com.
    expect(getCurrentTenant()).toBeNull();
  });

  it('returns the pinned dev tenant whatever the hostname', async () => {
    vi.stubEnv('VITE_DEV_TENANT', 'Demo');
    vi.resetModules();
    const tenant = await import('./tenant');
    expect(tenant.getCurrentTenant()).toBe('demo');
  });
});

describe('isValidSubdomain', () => {
  it('accepts lowercase letters, digits and inner hyphens', () => {
    expect(isValidSubdomain('mi-empresa-2')).toBe(true);
  });

  it.each(['a', '-acme', 'acme-', 'Acme', 'mi_empresa', 'a'.repeat(42)])('rejects "%s"', (name) => {
    expect(isValidSubdomain(name)).toBe(false);
  });

  it('rejects reserved names', () => {
    expect(isValidSubdomain('pango')).toBe(false);
  });
});

describe('slugify', () => {
  it('turns a name into a subdomain', () => {
    expect(slugify('Distribuidora del Caribe')).toBe('distribuidora-del-caribe');
  });

  it('keeps a trailing hyphen, since it runs while the person types', () => {
    expect(slugify('Mi ')).toBe('mi-');
  });

  it('drops accents', () => {
    expect(slugify('Ferretería Ñandú')).toBe('ferreteria-nandu');
  });
});

describe('buildTenantUrl / buildMainUrl', () => {
  it('points to the organization and to the main domain, keeping protocol and port', () => {
    const { protocol, port } = window.location;
    const origin = (host: string) => `${protocol}//${host}${port ? `:${port}` : ''}`;
    expect(buildTenantUrl('acme', '/login')).toBe(`${origin('acme.onpango.com')}/login`);
    expect(buildMainUrl()).toBe(`${origin('onpango.com')}/`);
  });
});
