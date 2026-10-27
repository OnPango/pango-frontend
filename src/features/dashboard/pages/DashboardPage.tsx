import { useAuthStore } from '@/core/auth/auth.store';
import { PageHeader } from '@/shared/ui/PageHeader';
import { buildGreeting, DashboardContent } from '../content/content';
import { StatOverviewCard } from '../components/StatOverviewCard';
import { RecentActivityCard } from '../components/RecentActivityCard';
import { InventoryLevel } from '../components/InventoryLevel';
import { ReplenishmentTable } from '../components/ReplenishmentTable';
import {
  mockDashboardMetrics,
  mockRecentActivities,
  mockInventoryLevels,
  mockReplenishmentProducts,
} from '../content/dashboard.mock';

export default function DashboardPage() {
  const userName = useAuthStore((state) => state.user?.name);

  return (
    <div className="flex min-w-0 flex-col gap-10 pb-10">
      {/* Greeting Header */}
      <PageHeader
        title={buildGreeting(userName)}
        subtitle={DashboardContent.message}
      />

      {/* Top Section: Subdivided Statistics & Recent Activity */}
      <section
        className="grid grid-cols-1 items-start gap-3 lg:grid-cols-12"
        aria-label="Resumen de estadísticas y actividad"
      >
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-8 xl:col-span-9">
          <StatOverviewCard metrics={mockDashboardMetrics} />
          <InventoryLevel items={mockInventoryLevels} />
        </div>

        <div className="flex h-full min-w-0 flex-col lg:col-span-4 xl:col-span-3">
          <RecentActivityCard activities={mockRecentActivities} />
        </div>
      </section>

      {/* Bottom Section: Replenishment Table */}
      <section aria-label="Productos por reponer" className="min-w-0">
        <ReplenishmentTable products={mockReplenishmentProducts} />
      </section>
    </div>
  );
}
