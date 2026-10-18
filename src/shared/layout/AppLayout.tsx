import { RxHamburgerMenu } from 'react-icons/rx';
import { TbLayoutSidebarLeftCollapseFilled } from "react-icons/tb";
import { TbLayoutSidebarRightCollapseFilled } from "react-icons/tb";
import { FiSearch } from "react-icons/fi";

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Button } from '@/shared/ui/components/Button';
import { ThemeToggle } from '@/shared/ui/components/ThemeToggle';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { useSidebarStore } from './sidebar.store';
import { cn } from '../lib/cn';
import { useAuthStore } from '@/core/auth/auth.store';
import { AvatarButton } from '../ui/components/AvatarButton';
import { Logo } from '../ui/Logo';
export function AppLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const toggle = useSidebarStore((state) => state.toggle);
    const user = useAuthStore((state) => state.user);
//   const logout = useAuthStore((state) => state.clearSession);
  const ToggleIcon = isCollapsed ? <TbLayoutSidebarRightCollapseFilled className='size-6'/> : <TbLayoutSidebarLeftCollapseFilled className='size-6' />
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border border-line2 bg-surface px-4 py-2 m-2 rounded-2xl md:px-6">
        <section className='flex items-center gap-3'>
            <Logo width='30' height='30'/>
            {/* Nombre del item */}
            <span className="text-xl font-medium">Dashboard</span>
            {toggle && (
          <Button
            type="button"
            variant='ghost'
            onClick={toggle}
            aria-expanded={!isCollapsed}
            aria-controls={'sidebar'}
            title={isCollapsed ? 'Expandir menú' : undefined}
            className='p-2'
            
          >
           {ToggleIcon}
          </Button>
        )}
        <span className='text-muted font-light'>/Dashboard</span>
        <div className="flex items-center w-md gap-4 rounded-full border border-line2 px-3 py-1 focus-within:border-accent">
            <FiSearch className="text-lg text-muted size-7" />
            <input type="search" name="search" id='header-search' placeholder="Búscar producto, código o alerta..." className="hidden md:block w-full outline-none" />
        </div>
        </section>

        <section className='flex gap-5'>
            <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          aria-label="Abrir menú"
          aria-expanded={isMobileNavOpen}
          aria-controls="mobile-nav"
          onClick={() => setIsMobileNavOpen(true)}
        >
          <RxHamburgerMenu aria-hidden className="size-5" />
        </Button>
        <ThemeToggle />
        <div className={cn('flex items-center text-right gap-2')}>
            <div className='flex flex-col min-w-0'>
                    <p className="truncate text-sm font-medium">{user?.name}</p>
                    <p className="truncate text-xs text-sidebar-fg/60">{user?.roleName}</p>
                  </div>
                  {user ? <AvatarButton user={user} /> : null}
                </div>
        </section>
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
    </div>
  );
}
