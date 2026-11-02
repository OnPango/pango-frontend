import { useEffect, useRef, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/auth.store';
import { useLogout } from '@/core/auth/useLogout';
import { cn } from '@/shared/lib/cn';
import { useVisibleNav } from '../nav.context';
import { Logo } from '@/shared/ui/Logo';

interface SidebarContentMobileProps {
  /** Called when a link is clicked; the drawer uses it to close itself. */
  onNavigate?: () => void;
  /** Close button. Rendered in the fixed top bar so it never scrolls away. */
  headerAction?: ReactNode;
}

export function SidebarContentMobile({ onNavigate, headerAction }: SidebarContentMobileProps) {
  const user = useAuthStore((state) => state.user);
  const { logout, isLoggingOut } = useLogout();
  const scrollerRef = useRef<HTMLElement>(null);

  const sections = useVisibleNav();

  // Center the current page when the menu opens. The parent calls showModal() in its own effect,
  // which runs after this one, so wait one frame until the dialog is actually laid out.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      // Optional call: jsdom does not implement scrollIntoView.
      scrollerRef.current
        ?.querySelector('[aria-current="page"]')
        ?.scrollIntoView?.({ block: 'center' });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex shrink-0 items-center justify-between px-6 pt-5">
        <Logo src="logos/pango-logo-horizontal-marron.svg" width="130" />
        {headerAction}
      </div>

      <nav
        ref={scrollerRef}
        aria-label="Navegación principal"
        className="[scrollbar-none] min-h-0 flex-1 snap-y snap-proximity overflow-y-auto overscroll-contain edge-fade-y px-6 py-[30dvh] [&::-webkit-scrollbar]:hidden"
      >
        <div className="mx-auto flex max-w-md flex-col gap-10">
          {sections.map((section) => {
            const headingId = `nav-section-${section.id}`;
            return (
              <div key={section.id}>
                <h2
                  id={headingId}
                  className="mb-3 text-center text-xs font-medium tracking-[0.2em] text-muted uppercase"
                >
                  {section.label}
                </h2>
                <ul aria-labelledby={headingId} className="flex flex-col gap-1">
                  {section.items.map((item) => (
                    <li key={item.to} className="nav-focus snap-center">
                      <NavLink
                        to={item.to}
                        end={item.to === '/'}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          cn(
                            'block rounded-2xl px-4 py-3 text-center font-display text-3xl font-semibold tracking-tight transition-colors focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-hidden',
                            isActive
                              ? 'text-primary after:mx-auto after:mt-1 after:block after:h-0.5 after:w-8 after:rounded-full after:bg-primary'
                              : 'text-fg hover:text-primary/80',
                          )
                        }
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="shrink-0 space-y-3 px-6 pt-3 pb-6">
        {user?.name && <p className="truncate text-center text-sm text-muted">{user.name}</p>}
        <button
          type="button"
          onClick={logout}
          disabled={isLoggingOut}
          className="w-full rounded-2xl border border-line bg-surface/60 px-4 py-3 text-base font-medium text-fg transition-colors hover:bg-fg/5 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-hidden"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
