import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { formatQuantity } from '@/shared/lib/units';
import { coverLabel, SEVERITY_LABELS } from '../content/dashboard.labels';
import type { ReplenishItem, Severity } from '../types/dashboard.types';
import { DashboardCard, EmptyNote, ListSkeleton } from './DashboardCard';

const BAR: Record<Severity, string> = {
  3: 'bg-danger',
  2: 'bg-danger/70',
  1: 'bg-warning',
};

const TEXT: Record<Severity, string> = {
  3: 'text-danger',
  2: 'text-danger',
  1: 'text-warning',
};

/**
 * Products at or below their reorder point, most severe first: available against the reorder
 * point and, with a forecast, how long it lasts. Each row opens its alert.
 */
export function LowStockCard({
  block,
  isLoading,
  className,
}: {
  block: { items: ReplenishItem[]; total: number } | undefined;
  isLoading: boolean;
  className?: string;
}) {
  return (
    <DashboardCard
      title="Productos con bajo stock"
      action={{ label: 'Ver todos', to: '/alerts' }}
      className={className}
    >
      {isLoading || !block ? (
        <ListSkeleton />
      ) : block.items.length === 0 ? (
        <EmptyNote>Ningún producto está en su punto de reorden.</EmptyNote>
      ) : (
        <ul className="-mr-2 min-h-0 flex-1 space-y-3.5 overflow-y-auto pr-2">
          {block.items.map((item) => {
            const share =
              item.reorderPoint > 0
                ? Math.min(Math.max(item.available / item.reorderPoint, 0), 1)
                : 0;
            const cover = coverLabel(item.daysOfCover);
            return (
              <li key={item.alertId}>
                <Link
                  to={`/alerts?alert=${item.alertId}`}
                  className="-mx-2 block rounded-xl px-2 py-1.5 transition hover:bg-canvas"
                >
                  <span className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium text-fg">
                      {item.product.name}
                    </span>
                    <span
                      className={cn('shrink-0 font-semibold tabular-nums', TEXT[item.severity])}
                    >
                      {formatQuantity(item.available, item.product.unit)}{' '}
                      <span className="font-normal text-muted">
                        de {formatQuantity(item.reorderPoint, item.product.unit)}
                      </span>
                    </span>
                  </span>
                  <span
                    className="mt-1.5 block h-2 overflow-hidden rounded-full bg-canvas"
                    aria-hidden
                  >
                    <span
                      className={cn('block h-full rounded-full', BAR[item.severity])}
                      style={{ width: `${Math.max(share * 100, 2)}%` }}
                    />
                  </span>
                  <span className="mt-1 flex justify-between gap-3 text-xs text-muted">
                    <span className="truncate">
                      {SEVERITY_LABELS[item.severity]} · {item.warehouse.name}
                      {item.status === 'attended' && ' · atendida'}
                    </span>
                    <span className="shrink-0">
                      {cover ?? `Reponer ${formatQuantity(item.suggested, item.product.unit)}`}
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
