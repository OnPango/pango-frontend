import { FiArrowDownLeft, FiArrowUpRight } from 'react-icons/fi';
import { cn } from '@/shared/lib/cn';
import { formatQuantity } from '@/shared/lib/units';
import { Badge } from '@/shared/ui/components/Badge';
import { formatDay, IMPORTED_CODE_LABELS } from '../content/dashboard.labels';
import type { ImportedMovementList } from '../types/dashboard.types';
import { DashboardCard, EmptyNote, ListSkeleton } from './DashboardCard';

/**
 * The latest lines of the history imported from the company's previous system, newest first,
 * each one labelled as imported: they never changed stock, and Pango's own movements are in
 * "Actividad reciente".
 */
export function ImportedHistoryCard({
  list,
  isLoading,
  isError,
  className,
}: {
  list: ImportedMovementList | undefined;
  isLoading: boolean;
  isError: boolean;
  className?: string;
}) {
  return (
    <DashboardCard
      title="Movimientos importados"
      description="Historial cargado desde tu sistema anterior. No cambió tus existencias: alimenta la demanda y los pronósticos."
      action={{ label: 'Ver todos', to: '/movements?view=imported' }}
      className={className}
    >
      {isError ? (
        <EmptyNote>No se pudo cargar el historial importado.</EmptyNote>
      ) : isLoading || !list ? (
        <ListSkeleton rows={3} />
      ) : list.items.length === 0 ? (
        <EmptyNote>Todavía no se ha importado historial de movimientos.</EmptyNote>
      ) : (
        <>
          <ul className="grid gap-x-6 gap-y-1 md:grid-cols-2 xl:grid-cols-3">
            {list.items.map((item) => {
              const inbound = item.quantity >= 0;
              const Icon = inbound ? FiArrowDownLeft : FiArrowUpRight;
              const unit = { code: item.product.unit, name: item.product.unit };
              return (
                <li key={item.id} className="flex items-start gap-3 rounded-xl py-2">
                  <span
                    aria-hidden
                    className={cn(
                      'grid size-9 shrink-0 place-items-center rounded-full border border-dashed',
                      inbound ? 'border-success/40 text-success' : 'border-primary/40 text-primary',
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-fg">
                        {IMPORTED_CODE_LABELS[item.code] ?? item.code}
                      </span>
                      <Badge tone="neutral" size="sm" className="shrink-0">
                        Importado
                      </Badge>
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {item.product.name} ({item.product.sku})
                    </span>
                    <span className="block truncate text-[11px] text-muted">
                      {formatDay(item.date)} · {item.warehouse.name} · {item.document}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 text-sm font-semibold tabular-nums',
                      inbound ? 'text-success' : 'text-danger',
                    )}
                  >
                    {inbound ? '+' : '−'}
                    {formatQuantity(Math.abs(item.quantity), unit)}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted">
            {list.total.toLocaleString('es-CO')} líneas importadas en total.
          </p>
        </>
      )}
    </DashboardCard>
  );
}
