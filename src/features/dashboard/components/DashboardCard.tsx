import type { ReactNode } from 'react';
import { FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { cn } from '@/shared/lib/cn';
import { Skeleton } from '@/shared/ui/components/Skeleton';

/**
 * A block of the dashboard: a title, an optional description, a link ("Ver todo →") or a control
 * on the right, and its content.
 */
export function DashboardCard({
  title,
  description,
  action,
  aside,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: { label: string; to: string };
  /** A control in the header, such as a period selector. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        'flex min-w-0 flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-xs sm:p-6',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-x-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-medium text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
        </div>
        {aside}
        {action && (
          <Link
            to={action.to}
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md text-sm font-medium whitespace-nowrap text-fg hover:text-primary"
          >
            {action.label} <FiArrowRight aria-hidden className="size-5" />
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

/** Rows standing in for a list while it loads. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** What a block says when there is nothing to show. */
export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl bg-canvas px-4 py-5 text-center text-sm text-muted">{children}</p>
  );
}
