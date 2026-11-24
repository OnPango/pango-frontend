import type { IconType } from 'react-icons';
import {
  FiAlertTriangle,
  FiArrowDown,
  FiArrowUp,
  FiBox,
  FiClipboard,
  FiLayers,
} from 'react-icons/fi';
import { formatMoney, formatMoneyShort } from '@/shared/lib/money';
import { cn } from '@/shared/lib/cn';
import { formatNumber } from '@/shared/lib/units';
import { Skeleton } from '@/shared/ui/components/Skeleton';
import { trendOf } from '../content/dashboard.labels';
import type { SummaryKpis, Trend } from '../types/dashboard.types';

interface Kpi {
  key: string;
  label: string;
  value: string;
  /** The exact value when `value` is abbreviated. */
  title?: string;
  icon: IconType;
  alert?: boolean;
  trend: Trend;
  /** Going up is bad news (low stock, requests waiting). */
  upIsBad?: boolean;
}

function toKpis(kpis: SummaryKpis, currency: string): Kpi[] {
  const list: Kpi[] = [];
  if (kpis.products) {
    list.push({
      key: 'products',
      label: 'Total de productos',
      value: formatNumber(kpis.products.current),
      icon: FiBox,
      trend: kpis.products,
    });
  }
  if (kpis.stockValue) {
    list.push({
      key: 'stock',
      label: 'Stock en mano',
      value: formatMoneyShort(kpis.stockValue.current, currency),
      title: `${formatMoney(kpis.stockValue.current, currency)} a costo promedio`,
      icon: FiLayers,
      trend: kpis.stockValue,
    });
  }
  if (kpis.lowStock) {
    list.push({
      key: 'low',
      label: 'Stock bajo',
      value: formatNumber(kpis.lowStock.current),
      title:
        kpis.lowStock.critical > 0
          ? `${kpis.lowStock.critical} sin disponible`
          : 'Productos en su punto de reorden o por debajo',
      icon: FiAlertTriangle,
      alert: kpis.lowStock.current > 0,
      trend: kpis.lowStock,
      upIsBad: true,
    });
  }
  if (kpis.pendingRequests) {
    list.push({
      key: 'requests',
      label: 'Solicitudes pendientes',
      value: formatNumber(kpis.pendingRequests.current),
      title: `${kpis.pendingRequests.pending} pendientes, ${kpis.pendingRequests.inProgress} en atención`,
      icon: FiClipboard,
      trend: kpis.pendingRequests,
      upIsBad: true,
    });
  }
  return list;
}

function TrendLine({ kpi }: { kpi: Kpi }) {
  const trend = trendOf(kpi.trend.current, kpi.trend.previous);
  if (!trend) {
    return <p className="text-sm text-muted">Igual que el mes anterior</p>;
  }
  const good = (trend.direction === 'up') !== Boolean(kpi.upIsBad);
  const Arrow = trend.direction === 'up' ? FiArrowUp : FiArrowDown;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
      <span
        className={cn(
          'inline-flex items-center gap-1 font-semibold tabular-nums',
          good ? 'text-success' : 'text-danger',
        )}
      >
        <Arrow aria-hidden className="size-4" />
        <span className="sr-only">{trend.direction === 'up' ? 'Subió' : 'Bajó'}</span>
        {trend.label}
      </span>
      <span className="text-muted">vs. mes anterior</span>
    </p>
  );
}

/**
 * The four key figures in one strip, each with how it changed against one month earlier (green
 * when that is good news). A figure the user cannot read is left out.
 */
export function KpiStrip({
  kpis,
  currency,
  isLoading,
}: {
  kpis: SummaryKpis | undefined;
  currency: string;
  isLoading: boolean;
}) {
  const frame =
    'grid grid-cols-2 gap-y-5 rounded-2xl border border-line bg-surface px-2 py-5 shadow-xs sm:px-4 xl:grid-cols-4 xl:gap-y-0';
  if (isLoading || !kpis) {
    return (
      <div aria-hidden className={frame}>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-3 px-4">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }
  const list = toKpis(kpis, currency);
  if (list.length === 0) return null;
  return (
    <section aria-label="Indicadores" className={frame}>
      {list.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.key}
            className={cn(
              'flex min-w-0 flex-col gap-3 pl-5 py-2',
              // A divider before every figure but the first of its row.
              index % 2 === 1 && 'border-l border-line2',
              index % 4 !== 0 && 'xl:border-l xl:border-line2',
              index % 4 === 0 && 'xl:border-l-0',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'grid size-10 place-items-center rounded-full',
                kpi.alert ? 'bg-danger/10 text-danger' : 'bg-canvas text-fg/80',
              )}
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm leading-snug text-muted">{kpi.label}</p>
              <p
                className="mt-1 mb-4 truncate font-display text-3xl font-medium tracking-tight text-fg tabular-nums xl:text-4xl"
                title={kpi.title}
              >
                {kpi.value}
              </p>
            </div>
            <TrendLine kpi={kpi} />
          </div>
        );
      })}
    </section>
  );
}
