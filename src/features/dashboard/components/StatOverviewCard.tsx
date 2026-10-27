import {
  FiPackage,
  FiLayers,
  FiAlertTriangle,
  FiShoppingCart,
  FiArrowUp,
  FiArrowDown,
} from 'react-icons/fi';
import type { StatMetric, MetricIconType } from '../types/dashboard.types';

interface StatOverviewCardProps {
  metrics: StatMetric[];
}

function renderMetricIcon(icon: MetricIconType) {
  switch (icon) {
    case 'box':
      return <FiPackage className="size-5 text-fg/80" />;
    case 'stack':
      return <FiLayers className="size-5 text-fg/80" />;
    case 'alert':
      return <FiAlertTriangle className="size-5 text-danger" />;
    case 'cart':
      return <FiShoppingCart className="size-5 text-fg/80" />;
  }
}

export function StatOverviewCard({ metrics }: StatOverviewCardProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-xs sm:p-6 xl:p-8">
      <div className="grid grid-cols-1 divide-y divide-line2 sm:grid-cols-2 sm:divide-y sm:divide-x xl:grid-cols-4 xl:divide-y-0 xl:divide-x">
        {metrics.map((metric, idx) => {
          const isAlert = metric.icon === 'alert';
          const isUp = metric.trend === 'up';

          return (
            <div
              key={metric.id}
              className={`flex min-w-0 flex-col justify-between gap-3 py-4 sm:px-4 sm:py-2 xl:px-6 ${
                idx === 0 ? 'sm:pl-0' : ''
              } ${idx === metrics.length - 1 ? 'sm:pr-0' : ''}`}
            >
              {/* Icon Container */}
              <div
                className={`grid size-10 shrink-0 place-items-center rounded-full ${
                  isAlert ? 'bg-danger/10 text-danger' : 'bg-canvas text-fg'
                }`}
                aria-hidden="true"
              >
                {renderMetricIcon(metric.icon)}
              </div>

              {/* Metric Values */}
              <div className="min-w-0">
                <p className="truncate text-xs font-normal text-muted sm:text-sm">{metric.label}</p>
                <p className="mt-1 truncate text-2xl font-medium tracking-tight text-fg lg:text-3xl xl:text-4xl">
                  {metric.value}
                </p>
              </div>

              {/* Trend Indicator */}
              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-xs">
                <span
                  className={`inline-flex shrink-0 items-center font-medium ${
                    isUp ? 'text-success' : 'text-danger'
                  }`}
                >
                  {isUp ? (
                    <FiArrowUp className="mr-0.5 size-3.5" aria-hidden="true" />
                  ) : (
                    <FiArrowDown className="mr-0.5 size-3.5" aria-hidden="true" />
                  )}
                  {metric.change}%
                </span>
                <span className="whitespace-nowrap text-[11px] text-muted">
                  {metric.changePeriod}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
