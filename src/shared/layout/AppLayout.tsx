import { RxHamburgerMenu } from 'react-icons/rx';
import { TbLayoutSidebarLeftCollapseFilled } from 'react-icons/tb';
import { TbLayoutSidebarRightCollapseFilled } from 'react-icons/tb';
import { FiSearch } from 'react-icons/fi';
import { IoNotifications } from 'react-icons/io5';

import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Button } from '@/shared/ui/components/Button';
import { ThemeToggle } from '@/shared/ui/components/ThemeToggle';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { useSidebarStore } from './sidebar.store';
import { NavContext, useCurrentNavItem } from './nav.context';
import type { NavSection } from './nav';
import { cn } from '../lib/cn';
import { useAuthStore } from '@/core/auth/auth.store';
import { TextBox } from '../ui/components/form/TextBox';
import { AvatarButton } from '../ui/components/AvatarButton';
import { Logo } from '../ui/Logo';

interface AppLayoutProps {
  /** The whole menu. The layout only shows the items the signed-in user may open. */
  navSections: NavSection[];
}

/** Provides the menu to the shell: the title in the header reads it from the context too. */
export function AppLayout({ navSections }: AppLayoutProps) {
  return (
    <NavContext value={navSections}>
      <AppShell />
    </NavContext>
  );
}

function AppShell() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const toggle = useSidebarStore((state) => state.toggle);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const currentItem = useCurrentNavItem();
  const ToggleIcon = isCollapsed ? (
    <TbLayoutSidebarRightCollapseFilled className="size-6" />
  ) : (
    <TbLayoutSidebarLeftCollapseFilled className="size-6" />
  );

  return (
    <div className="fixed inset-0 flex flex-col gap-2 overflow-hidden p-2">
      <header className="flex w-full shrink-0 items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-2 md:px-6">
        <section className="flex items-center gap-3">
          <Logo width="30" height="30" />
          {/* Nombre del item */}
          <span className="text-md hidden font-semibold uppercase lg:block">
            {currentItem?.label}
          </span>
          {toggle && (
            <Button
              type="button"
              variant="ghost"
              onClick={toggle}
              aria-expanded={!isCollapsed}
              aria-controls={'sidebar'}
              title={isCollapsed ? 'Expandir menú' : undefined}
              className="hidden p-2 lg:flex"
            >
              {ToggleIcon}
            </Button>
          )}
          <span className="hidden font-light text-muted lg:block">{location.pathname}</span>
          <TextBox
            type="search"
            name="search"
            id="header-search"
            aria-label="Buscar"
            placeholder="Buscar producto, código o alerta..."
            leadingIcon={FiSearch}
            size="sm"
            shape="full"
            containerClassName="hidden w-md lg:block"
          />
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            aria-label="Abrir menú"
            aria-expanded={isMobileNavOpen}
            aria-controls="mobile-nav"
            onClick={() => setIsMobileNavOpen(true)}
          >
            <RxHamburgerMenu aria-hidden className="size-5" />
          </Button>
        </section>

        <section className="flex gap-5">
          <ThemeToggle />
          <Button variant="ghost" size="sm" className="p-2 text-fg" aria-label="Notificaciones">
            <IoNotifications aria-hidden className="size-5" />
          </Button>
          <div className={cn('flex items-center gap-2 text-right')}>
            {user ? <AvatarButton user={user} /> : null}
          </div>
        </section>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <Sidebar />
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
    </div>
  );
}
