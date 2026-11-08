import { IoLogOut } from 'react-icons/io5';
import { NavLink } from 'react-router-dom';
import { useLogout } from '@/core/auth/useLogout';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/components/Button';
import { useVisibleNav } from '../nav.context';

interface SidebarContentProps {
  /** Icon-only mode. Labels stay in the DOM (screen-reader only) and get a native tooltip. */
  isCollapsed: boolean;
  /** Called when a link is clicked; the mobile drawer uses it to close itself. */
  onNavigate?: () => void;
}

const footerButton =
  'w-full justify-start gap-3 rounded-lg px-3 py-2 text-sm font-normal text-sidebar-fg/80 hover:bg-sidebar-fg/10 hover:text-sidebar-fg';

export function SidebarContent({ isCollapsed, onNavigate }: SidebarContentProps) {
  const { logout, isLoggingOut } = useLogout();
  const sections = useVisibleNav();

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
                            'flex items-center gap-3 rounded-full text-sm transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-hidden',
                            centerWhenCollapsed,
                            isActive
                              ? 'bg-primary px-4 py-3 text-primary-fg'
                              : 'px-3 py-2 text-sidebar-fg hover:bg-sidebar-fg/10 hover:text-sidebar-fg',
                          )
                        }
                      >
                        {Icon && <Icon aria-hidden className="size-5 shrink-0" />}
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
        <Button
          variant="ghost"
          onClick={logout}
          disabled={isLoggingOut}
          title={isCollapsed ? 'Cerrar sesión' : undefined}
          className={cn(footerButton, centerWhenCollapsed)}
        >
          <IoLogOut aria-hidden className="size-5 shrink-0" />
          <span className={cn(hiddenWhenCollapsed)}>Cerrar sesión</span>
        </Button>
      </div>
    </div>
  );
}
