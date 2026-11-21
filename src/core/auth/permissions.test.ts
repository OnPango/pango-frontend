import { describe, expect, it } from 'vitest';
import { hasAnyPermission } from './permissions';
import type { Permission, User } from './user';

const userWith = (permissions: Permission[]): User => ({
  id: '1',
  name: 'Ana',
  email: 'ana@acme.co',
  jobTitle: null,
  organization: { id: '1', subdomain: 'acme', legalName: 'Acme S.A.S.' },
  roles: [],
  permissions,
});

describe('hasAnyPermission', () => {
  it('lets anyone through when nothing is required', () => {
    expect(hasAnyPermission(null, [])).toBe(true);
  });

  it('denies a visitor without a session', () => {
    expect(hasAnyPermission(null, ['catalog.read'])).toBe(false);
  });

  it('allows a user holding any one of the permissions', () => {
    expect(hasAnyPermission(userWith(['stock.read']), ['catalog.read', 'stock.read'])).toBe(true);
  });

  it('denies a user holding none of them', () => {
    expect(hasAnyPermission(userWith(['alert.read']), ['catalog.read', 'stock.read'])).toBe(false);
  });
});
