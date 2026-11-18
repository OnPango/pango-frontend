import { cn } from '@/shared/lib/cn';
import { SidebarContent } from './SidebarContent';
import { useSidebarStore } from '../sidebar.store';

const SIDEBAR_ID = 'sidebar';

/** Desktop sidebar (md and up): sticky, full height, collapsible to icons. */
export function Sidebar() {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);

  return (
    <aside
      id={SIDEBAR_ID}
      className={cn(
        'hidden shrink-0 bg-sidebar text-sidebar-fg transition-[width] duration-500 lg:block',
        isCollapsed ? 'w-18' : 'w-55 border-r border-line2',
      )}
    >
      <SidebarContent isCollapsed={isCollapsed} />
    </aside>
  );
}
