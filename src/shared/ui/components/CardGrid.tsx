import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Alert } from './Alert';
import { Pagination, type PaginationProps } from './pagination/Pagination';
import { Skeleton } from './Skeleton';

export interface CardGridProps<T> {
  items: T[];
  getItemKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  /** Accessible name of the card list. */
  ariaLabel: string;
  isLoading?: boolean;
  skeletonCount?: number;
  skeletonClassName?: string;
  error?: string;
  emptyMessage?: string;
  /** Adds a pagination bar below the grid. Controlled by the parent, mirroring `DataTable`. */
  pagination?: Omit<PaginationProps, 'className'>;
  className?: string;
}

/** Presentational responsive card grid with loading, error, empty states, and optional pagination. */
export function CardGrid<T>({
  items,
  getItemKey,
  renderItem,
  ariaLabel,
  isLoading = false,
  skeletonCount = 6,
  skeletonClassName,
  error,
  emptyMessage = 'No hay elementos para mostrar.',
  pagination,
  className,
}: CardGridProps<T>) {
  if (error) {
    return <Alert tone="danger">{error}</Alert>;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div
          aria-busy="true"
          aria-label={`Cargando ${ariaLabel.toLowerCase()}`}
          className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}
        >
          {Array.from({ length: skeletonCount }, (_, index) => (
            <Skeleton key={index} className={cn('h-64 rounded-2xl', skeletonClassName)} />
          ))}
        </div>
        {pagination && (
          <div
            aria-hidden
            className="flex flex-col gap-3 rounded-2xl border border-line2 bg-surface px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <Skeleton className="w-36" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-10 rounded-xl" />
              <Skeleton className="h-8 w-8 rounded-xl" />
              <Skeleton className="h-9 w-10 rounded-xl" />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-line2 bg-surface px-4 py-8 text-center text-sm text-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ul
        aria-label={ariaLabel}
        className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}
      >
        {items.map((item) => (
          <li key={getItemKey(item)} className="flex min-w-0">
            {renderItem(item)}
          </li>
        ))}
      </ul>
      {pagination && <Pagination {...pagination} className="rounded-2xl px-5 py-3.5" />}
    </div>
  );
}
