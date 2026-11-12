import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Pagination, type PaginationProps } from './pagination/Pagination';
import { CellPlaceholder, Skeleton } from './Skeleton';
import type { Column } from '@/shared/types/dataTable';

interface DataTableProps<T> {
  columns: Column<T>[];
  /** Rows to display. With `pagination`, pass only the rows of the current page. */
  rows: T[];
  getRowKey: (row: T) => string;
  /** Accessible name of the table (visually hidden). */
  caption: string;
  /** First load: skeleton rows shaped like the columns (`Column.skeleton`) keep the layout. */
  isLoading?: boolean;
  /** How many skeleton rows while loading (default: the page size, up to 6). */
  skeletonRows?: number;
  /**
   * The rows on screen belong to the previous query (other filters or page) while the new one
   * loads: they are dimmed and locked, and a progress bar says the change is under way.
   */
  isRefreshing?: boolean;
  error?: string;
  emptyMessage?: string;
  /** Extra classes for the outer card (margin, width, …). */
  className?: string;
  /** Adds a pagination bar below the table. The table stays controlled by the parent. */
  pagination?: Omit<PaginationProps, 'className'>;
}

/** Presentational table with loading, error and empty states, and optional pagination. */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  caption,
  isLoading = false,
  isRefreshing = false,
  skeletonRows,
  error,
  emptyMessage = 'No hay datos para mostrar.',
  className,
  pagination,
}: DataTableProps<T>) {
  const refreshing = isRefreshing && !isLoading;
  const statusRow = (content: ReactNode, tone = 'text-muted') => (
    <tr>
      <td colSpan={columns.length} className={cn('px-4 py-8 text-center text-sm', tone)}>
        {content}
      </td>
    </tr>
  );

  let body: ReactNode;
  if (isLoading) {
    const count = skeletonRows ?? Math.min(pagination?.pageSize ?? 5, 6);
    body = Array.from({ length: count }, (_, row) => (
      <tr key={row} aria-hidden className="border-t border-line2">
        {columns.map((column, index) => (
          <td key={column.key} className={cn('px-4 py-3', column.className)}>
            <CellPlaceholder
              shape={column.skeleton}
              seed={row * 3 + index}
              alignEnd={/\btext-right\b/.test(column.className ?? '')}
            />
          </td>
        ))}
      </tr>
    ));
  } else if (error) body = statusRow(<span role="alert">{error}</span>, 'text-danger');
  else if (rows.length === 0) body = statusRow(emptyMessage);
  else
    body = rows.map((row) => (
      <tr key={getRowKey(row)} className="border-t border-line2">
        {columns.map((column) => (
          <td key={column.key} className={cn('px-4 py-3', column.className)}>
            {column.cell(row)}
          </td>
        ))}
      </tr>
    ));

  return (
    <div
      className={cn(
        'relative min-w-0 rounded-2xl border border-line bg-surface px-4 py-6 sm:px-8',
        className,
      )}
    >
      {isLoading && (
        <p role="status" className="sr-only">
          Cargando…
        </p>
      )}
      {refreshing && (
        <>
          {/* Over the card's border (-1px), with its radius: the edge itself shows the progress. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-px edge-progress rounded-2xl"
          />
          <p role="status" className="sr-only">
            Actualizando…
          </p>
        </>
      )}
      {/* While refreshing, the previous rows must not be acted on: they may not match any more. */}
      <div
        inert={refreshing}
        className={cn('transition-opacity duration-200', refreshing && 'opacity-50')}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-busy={isLoading || refreshing}>
            <caption className="sr-only">{caption}</caption>
            <thead className="text-xs text-muted uppercase">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn('px-4 py-3 font-medium', column.className)}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>{body}</tbody>
          </table>
        </div>

        {pagination && !error && isLoading ? (
          // The bar the pagination will take, so the card does not grow when the data lands.
          <div
            aria-hidden
            className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <Skeleton className="w-36" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-10 rounded-xl" />
              <Skeleton className="h-8 w-8 rounded-xl" />
              <Skeleton className="h-9 w-10 rounded-xl" />
            </div>
          </div>
        ) : (
          pagination &&
          !error && <Pagination {...pagination} className="border-t border-line px-4 py-3" />
        )}
      </div>
    </div>
  );
}
