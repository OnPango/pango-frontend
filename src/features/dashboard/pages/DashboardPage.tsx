import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import { Alert } from '@/shared/ui/components/Alert';
import { cn } from '@/shared/lib/cn';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useDashboardSummary, useImportedMovements } from '../api/dashboard.queries';
import { ImportedHistoryCard } from '../components/ImportedHistoryCard';
import { InventoryLevelCard } from '../components/InventoryLevelCard';
import { KpiStrip } from '../components/KpiStrip';
import { LowStockCard } from '../components/LowStockCard';
import { RecentActivity } from '../components/RecentActivity';
import { buildGreeting, DashboardContent } from '../content/content';

/**
 * The row of the two cards below the key figures is as tall as the inventory level needs, never
 * below 26rem, so it fits however narrow the cards get (small screens, zoom).
 */
const LEVEL_HEIGHT = 'min-h-[26rem]';
/**
 * Side by side, the low stock card takes the row's height without adding its own (`h-0` +
 * `min-h-full`): its list scrolls inside instead of stretching the row. Stacked, it is as tall as
 * its list, which scrolls past 26rem.
 */
const LOW_STOCK_HEIGHT = 'max-h-[26rem] lg:h-0 lg:max-h-none lg:min-h-full';

/**
 * US-047: the organization at a glance. The key figures with "Nivel de inventario" and
 * "Productos con bajo stock" below them, and the recent activity on the right. Each block shows
 * only with the read permission of its module.
 */
export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const readsStock = hasAnyPermission(user, ['stock.read']);
  const summary = useDashboardSummary(null);
  const readsMovements = hasAnyPermission(user, ['movement.read']);
  const imported = useImportedMovements(null, readsMovements);
  // Only once something was imported: a company that never imported does not see the block.
  const showsImported = readsMovements && (imported.data?.total ?? 0) > 0;

  const data = summary.data;
  const isLoading = summary.isPending;
  const showsLowStock = isLoading || data?.lowStockItems != null;
  const showsActivity = isLoading || data?.recentActivity != null;

  return (
    <div className="flex min-w-0 flex-col gap-4 pb-10">
      <PageHeader title={buildGreeting(user?.name)} subtitle={DashboardContent.message} />

      {summary.isError && !data && (
        <Alert tone="danger">No se pudo cargar el panel. Intenta de nuevo en un momento.</Alert>
      )}

      <div
        className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-4"
        aria-busy={summary.isFetching || undefined}
      >
        <div
          className={
            showsActivity
              ? 'flex min-w-0 flex-col gap-4 xl:col-span-3'
              : 'flex min-w-0 flex-col gap-4 xl:col-span-4'
          }
        >
          <KpiStrip kpis={data?.kpis} currency={data?.currency ?? 'COP'} isLoading={isLoading} />
          {(readsStock || showsLowStock) && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {readsStock && (
                <InventoryLevelCard
                  warehouseId={null}
                  className={cn(LEVEL_HEIGHT, !showsLowStock && 'lg:col-span-2')}
                />
              )}
              {showsLowStock && (
                <LowStockCard
                  block={data?.lowStockItems ?? undefined}
                  isLoading={isLoading}
                  className={cn(
                    readsStock ? LOW_STOCK_HEIGHT : LEVEL_HEIGHT,
                    !readsStock && 'lg:col-span-2',
                  )}
                />
              )}
            </div>
          )}
        </div>
        {showsActivity && (
          <RecentActivity items={data?.recentActivity ?? undefined} isLoading={isLoading} />
        )}
      </div>
      {showsImported && (
        <ImportedHistoryCard
          list={imported.data}
          isLoading={imported.isPending}
          isError={imported.isError}
        />
      )}
    </div>
  );
}
