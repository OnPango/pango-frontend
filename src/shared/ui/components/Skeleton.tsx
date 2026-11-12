import { cn } from '@/shared/lib/cn';
import type { CellSkeleton } from '@/shared/types/dataTable';

/**
 * A placeholder block with a shimmer. All blocks share one sweep across the screen (the shimmer is
 * fixed to the viewport), so a skeleton reads as one surface loading, not many blinking pieces.
 * Size and shape come from `className`.
 */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn('block h-3.5 skeleton rounded-md', className)} />;
}

/** Widths that vary between rows, so the skeleton looks like real, uneven text. */
const WIDTHS = ['w-3/4', 'w-1/2', 'w-5/6', 'w-2/3', 'w-3/5'];
const SHORT_WIDTHS = ['w-1/3', 'w-2/5', 'w-1/4', 'w-1/2', 'w-1/3'];

/**
 * The placeholder of one table cell, shaped like what the cell will hold. `alignEnd` for columns
 * aligned to the right (quantities, actions), so the blocks sit under their header.
 */
export function CellPlaceholder({
  shape = 'text',
  seed,
  alignEnd = false,
}: {
  shape?: CellSkeleton;
  seed: number;
  alignEnd?: boolean;
}) {
  const width = WIDTHS[seed % WIDTHS.length];
  const short = SHORT_WIDTHS[seed % SHORT_WIDTHS.length];
  const end = alignEnd && 'ml-auto';
  switch (shape) {
    case 'none':
      return null;
    case 'badge':
      return <Skeleton className={cn('h-6 w-20 rounded-full', end)} />;
    case 'button':
      return <Skeleton className={cn('h-8 w-20 rounded-xl', end)} />;
    case 'title':
      return (
        <span className="block space-y-2 py-0.5">
          <Skeleton className={cn('min-w-24', width, end)} />
          <Skeleton className={cn('h-2.5 min-w-14', short, end)} />
        </span>
      );
    case 'stack':
      return (
        <span className="block space-y-2 py-0.5">
          <Skeleton className={cn('min-w-20', width, end)} />
          <Skeleton className={cn('h-2.5 min-w-16', short, end)} />
          <Skeleton className={cn('h-2.5 min-w-20', width, end)} />
        </span>
      );
    case 'avatar':
      return (
        <span className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <span className="block min-w-0 flex-1 space-y-2">
            <Skeleton className={cn('min-w-24', width)} />
            <Skeleton className={cn('h-2.5 min-w-20', short)} />
          </span>
        </span>
      );
    default:
      return <Skeleton className={cn('min-w-12', width, end)} />;
  }
}
