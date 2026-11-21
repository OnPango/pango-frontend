import { describe, expect, it } from 'vitest';
import { samePermissions, withPermission, withoutPermission } from './permissions.rules';

describe('withPermission', () => {
  it('also grants the permission it depends on', () => {
    expect(withPermission([], 'product.manage')).toEqual(['catalog.read', 'product.manage']);
  });

  it('does not duplicate a permission already granted', () => {
    const next = withPermission(['catalog.read', 'product.manage'], 'product.manage');
    expect(next).toEqual(['catalog.read', 'product.manage']);
  });

  it('keeps the catalog order whatever the order of the input', () => {
    expect(withPermission(['stock.read'], 'user.read')).toEqual(['user.read', 'stock.read']);
  });
});

describe('withoutPermission', () => {
  it('also removes every permission that depends on it', () => {
    const current = withPermission(withPermission([], 'product.manage'), 'category.manage');
    expect(withoutPermission([...current, 'stock.read'], 'catalog.read')).toEqual(['stock.read']);
  });

  it('keeps the permission a removed one depended on', () => {
    expect(withoutPermission(['alert.read', 'alert.resolve'], 'alert.resolve')).toEqual([
      'alert.read',
    ]);
  });
});

describe('samePermissions', () => {
  it('ignores the order', () => {
    expect(samePermissions(['alert.read', 'stock.read'], ['stock.read', 'alert.read'])).toBe(true);
  });

  it('tells different sets apart', () => {
    expect(samePermissions(['alert.read'], ['alert.read', 'stock.read'])).toBe(false);
  });
});
