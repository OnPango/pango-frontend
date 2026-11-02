import { FiPlus, FiPackage, FiShoppingCart, FiArrowRight } from 'react-icons/fi';
import type { RecentActivity, ActivityType } from '../types/dashboard.types';

interface RecentActivityCardProps {
  activities: RecentActivity[];
  onViewAll?: () => void;
}

function renderActivityIcon(type: ActivityType) {
  switch (type) {
    case 'new_product':
      return (
        <div
          className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <FiPlus className="size-5" />
        </div>
      );
    case 'inventory_in':
      return (
        <div
          className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary/15 text-secondary"
          aria-hidden="true"
        >
          <FiPackage className="size-5" />
        </div>
      );
    case 'order':
      return (
        <div
          className="grid size-10 shrink-0 place-items-center rounded-full bg-line2/40 text-fg"
          aria-hidden="true"
        >
          <FiShoppingCart className="size-5" />
        </div>
      );
  }
}

export function RecentActivityCard({ activities, onViewAll }: RecentActivityCardProps) {
  return (
    <div className="flex h-full min-w-0 flex-col justify-start rounded-2xl border border-line bg-surface p-5 shadow-xs sm:p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="truncate text-base font-semibold text-fg sm:text-lg">Actividad reciente</h2>
        <button
          type="button"
          onClick={onViewAll}
          className="group inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-fg"
        >
          <span>Ver todo</span>
          <FiArrowRight
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Activity Items List */}
      <div className="flex min-w-0 flex-col divide-y divide-line2/60">
        {activities.map((act) => (
          <div key={act.id} className="flex min-w-0 items-start gap-3.5 py-3 first:pt-0 last:pb-0">
            {renderActivityIcon(act.type)}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{act.title}</p>
              <p className="truncate text-xs text-muted">{act.subtitle}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted/80">{act.timeAgo}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
