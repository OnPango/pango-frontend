import { createContext, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import type { Permission } from '@/core/auth/user';
import type { NavItem, NavSection } from './nav';

/**
 * The full menu. `shared` cannot import the route table (that lives in `app/`), so the app hands
 * it to `AppLayout`, which provides it here.
 */
export const NavContext = createContext<NavSection[]>([]);

const keepVisible = (sections: NavSection[], canOpen: (item: NavItem) => boolean): NavSection[] =>
  sections
    .map((section) => ({ ...section, items: section.items.filter(canOpen) }))
    .filter((section) => section.items.length > 0);

/** The menu limited to what the current user may open; sections left empty are dropped. */
export function useVisibleNav(): NavSection[] {
  const sections = useContext(NavContext);
  const user = useAuthStore((state) => state.user);

  return useMemo(
    () => keepVisible(sections, (item) => hasAnyPermission(user, item.anyOf)),
    [sections, user],
  );
}

/** The menu someone holding exactly `permissions` would see (to preview a role). */
export function useNavFor(permissions: readonly Permission[]): NavSection[] {
  const sections = useContext(NavContext);

  return useMemo(
    () =>
      keepVisible(
        sections,
        (item) => item.anyOf.length === 0 || item.anyOf.some((p) => permissions.includes(p)),
      ),
    [sections, permissions],
  );
}

/** The menu item the current URL belongs to: the longest matching path, so `/users/3` is "Users". */
export function useCurrentNavItem(): NavItem | undefined {
  const sections = useContext(NavContext);
  const { pathname } = useLocation();

  return useMemo(() => {
    let current: NavItem | undefined;
    for (const item of sections.flatMap((section) => section.items)) {
      const matches =
        item.to === '/'
          ? pathname === '/'
          : pathname === item.to || pathname.startsWith(`${item.to}/`);
      if (matches && (!current || item.to.length > current.to.length)) current = item;
    }
    return current;
  }, [sections, pathname]);
}
