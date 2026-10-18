import { cn } from '@/shared/lib/cn';
import { SidebarContent } from './SidebarContent';
import { useSidebarStore } from '../sidebar.store';

const SIDEBAR_ID = 'sidebar';

/** Desktop sidebar (md and up): sticky, full height, collapsible to icons. */
export function Sidebar() {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const toggle = useSidebarStore((state) => state.toggle);

  return (
    <aside
      id={SIDEBAR_ID}
      className={cn(
        'hidden shrink-0 bg-sidebar text-sidebar-fg transition-[width] duration-200 md:block',
        isCollapsed ? 'w-18' : 'w-60',
      )}
    >
      <SidebarContent isCollapsed={isCollapsed} onToggleCollapse={toggle} controlsId={SIDEBAR_ID} />
    </aside>
  );
}
