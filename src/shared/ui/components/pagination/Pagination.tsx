import { useId } from 'react';
import { cn } from '@/shared/lib/cn';
import { getPageItems, getPageRange } from '@/shared/ui/components/pagination/pagination.utils';
import { Button } from '@/shared/ui/components/Button';
import { Select } from '@/shared/ui/components/form/select/Select';

export interface PaginationProps {
  /** Current page, 1-based. */
  page: number;
  pageSize: number;
  /** Total items across all pages (not just the current one). */
  totalItems: number;
  onPageChange: (page: number) => void;
  /** Shows a "rows per page" selector when given together with `onPageSizeChange`. */
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
}

const formatNumber = (value: number) => value.toLocaleString('es-CO');

/** Controlled pagination bar: summary, rows-per-page selector and page buttons. */
export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  className,
}: PaginationProps) {
  const selectId = useId();
  if (totalItems <= 0) return null;

  const { from, to, totalPages, currentPage } = getPageRange(page, pageSize, totalItems);
  const items = getPageItems(currentPage, totalPages);
  const showPageSize = pageSizeOptions && onPageSizeChange;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p aria-live="polite" className="text-muted">
        {`Mostrando ${formatNumber(from)}–${formatNumber(to)} de ${formatNumber(totalItems)}`}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {showPageSize && (
          <div className="flex items-center gap-2">
            <span className="text-muted">Filas por página</span>
            <Select
              id={selectId}
              size="sm"
              aria-label="Filas por página"
              value={String(pageSize)}
              onChange={(value) => onPageSizeChange(Number(value))}
              options={pageSizeOptions.map((option) => ({
                value: String(option),
                label: String(option),
              }))}
              className="w-20"
            />
          </div>
        )}

        <nav aria-label="Paginación" className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Anterior
          </Button>

          {/* Small screens: a compact label instead of the numbered buttons */}
          <span className="px-2 text-muted sm:hidden">{`Página ${currentPage} de ${totalPages}`}</span>

          <ul className="hidden items-center gap-1 sm:flex">
            {items.map((item) =>
              typeof item === 'number' ? (
                <li key={item}>
                  <Button
                    variant={item === currentPage ? 'primary' : 'ghost'}
                    size="sm"
                    className="min-w-9"
                    aria-label={`Página ${item}`}
                    aria-current={item === currentPage ? 'page' : undefined}
                    onClick={() => onPageChange(item)}
                  >
                    {item}
                  </Button>
                </li>
              ) : (
                <li key={item} aria-hidden className="px-1 text-muted">
                  …
                </li>
              ),
            )}
          </ul>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Siguiente
          </Button>
        </nav>
      </div>
    </div>
  );
}
