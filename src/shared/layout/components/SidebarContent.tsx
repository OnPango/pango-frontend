// import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import { cn } from '@/shared/lib/cn';
import { NAV_SECTIONS } from '../nav';

interface SidebarContentProps {
  /** Icon-only mode. Labels stay in the DOM (screen-reader only) and get a native tooltip. */
  isCollapsed: boolean;
  /** Called when a link is clicked; the mobile drawer uses it to close itself. */
  onNavigate?: () => void;
  /** Desktop only: when given, a collapse/expand button is shown. */
  onToggleCollapse?: () => void;
  /** Extra control next to the brand (the drawer's close button). */
  headerAction?: ReactNode;
  /** Id of the element the collapse button controls. */
  controlsId?: string;
}

const footerButton =
  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-fg/80 transition hover:bg-sidebar-fg/10 hover:text-sidebar-fg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/60';

export function SidebarContent({
  isCollapsed,
  onNavigate,
}: SidebarContentProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.clearSession);

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => hasAnyPermission(user, item.anyOf ? item.anyOf : [])),
  })).filter((section) => section.items.length > 0);

  const hiddenWhenCollapsed = isCollapsed && 'sr-only';
  const centerWhenCollapsed = isCollapsed && 'justify-center px-0';

  return (
    <div className="flex h-full flex-col pt-4">
      <nav aria-label="Navegación principal" className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {sections.map((section, index) => {
          const headingId = `nav-section-${section.id}`;
          return (
            <div
              key={section.id}
              className={cn(isCollapsed && index > 0 && 'border-t border-sidebar-fg/10 pt-4')}
            >
              <h2
                id={headingId}
                className={cn(
                  'px-3 pb-1 text-xs font-medium tracking-wide text-sidebar-fg/60 uppercase',
                  hiddenWhenCollapsed,
                )}
              >
                {section.label}
              </h2>
              <ul aria-labelledby={headingId} className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/'}
                        title={isCollapsed ? item.label : undefined}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-hidden',
                            centerWhenCollapsed,
                            isActive
                              ? 'bg-primary text-primary-fg'
                              : 'text-sidebar-fg hover:bg-sidebar-fg/10 hover:text-sidebar-fg',
                          )
                        }
                      >
                        {Icon && (
                          <Icon aria-hidden className="size-5 shrink-0" />
                        )
                        }
                        <span className={cn(hiddenWhenCollapsed)}>{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-sidebar-fg/10 p-3">
        <button
          type="button"
          onClick={logout}
          title={isCollapsed ? 'Cerrar sesión' : undefined}
          className={cn(footerButton, centerWhenCollapsed)}
        >
          {/* <LogOut aria-hidden className="size-5 shrink-0" /> */}
          <span className={cn(hiddenWhenCollapsed)}>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}
