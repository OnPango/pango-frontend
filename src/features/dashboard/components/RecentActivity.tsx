import type { IconType } from 'react-icons';
import { FiArrowDownLeft, FiArrowUpRight, FiRepeat, FiSliders } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { movementTypeLabel } from '@/shared/lib/movementTypes';
import { timeAgo } from '../content/dashboard.labels';
import type { ActivityItem, MovementNature } from '../types/dashboard.types';
import { DashboardCard, EmptyNote, ListSkeleton } from './DashboardCard';

const NATURE: Record<MovementNature, { icon: IconType; tile: string }> = {
  inbound: { icon: FiArrowDownLeft, tile: 'bg-success/10 text-success' },
  outbound: { icon: FiArrowUpRight, tile: 'bg-primary/10 text-primary' },
  transfer: { icon: FiRepeat, tile: 'bg-secondary/10 text-secondary' },
  adjustment: { icon: FiSliders, tile: 'bg-fg/10 text-fg/80' },
};

/** The latest movements, newest first; each row opens it in Movimientos. */
export function RecentActivity({
  items,
  isLoading,
  className,
}: {
  items: ActivityItem[] | undefined;
  isLoading: boolean;
  className?: string;
}) {
  return (
    <DashboardCard
      title="Actividad reciente"
      action={{ label: 'Ver todo', to: '/movements' }}
      className={className}
    >
      {isLoading || !items ? (
        <ListSkeleton rows={5} />
      ) : items.length === 0 ? (
        <EmptyNote>Todavía no hay movimientos registrados.</EmptyNote>
      ) : (
        <ul className="-mx-2 space-y-1">
          {items.map((item) => {
            const { icon: Icon, tile } = NATURE[item.nature];
            const more = item.lineCount > 1 ? ` y ${item.lineCount - 1} más` : '';
            return (
              <li key={item.id}>
                <Link
                  to={`/movements?movement=${item.id}`}
                  className="flex items-start gap-3 rounded-xl px-2 py-2 transition hover:bg-canvas"
                >
                  <span
                    aria-hidden
                    className={cn('grid size-9 shrink-0 place-items-center rounded-full', tile)}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">
                      {movementTypeLabel({ name: item.type })}
                      {item.status === 'inTransit' && ' · en camino'}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {item.firstProduct} ({item.firstSku}){more}
                    </span>
                    <span className="block truncate text-[11px] text-muted">
                      {timeAgo(item.occurredAt)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
