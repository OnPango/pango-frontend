import { useMemo, useSyncExternalStore } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatNumber, formatQuantity, type UnitRef } from '@/shared/lib/units';
import { formatWeek, isCurrentWeek } from '../content/forecast.labels';
import type { DemandPeriod, ForecastPeriod } from '../types/forecast.types';

interface Row {
  start: string;
  demand: number | null;
  /** The week has not ended: its demand is still growing. */
  partial: boolean;
  estimate: number | null;
  range: [number, number] | null;
}

function toRows(history: DemandPeriod[], forecast: ForecastPeriod[]): Row[] {
  const rows = new Map<string, Row>();
  for (const { start, quantity } of history) {
    rows.set(start, {
      start,
      demand: quantity,
      partial: isCurrentWeek(start),
      estimate: null,
      range: null,
    });
  }
  for (const { start, estimate, lower, upper } of forecast) {
    const row = rows.get(start) ?? { start, demand: null, partial: false, estimate, range: null };
    rows.set(start, { ...row, estimate, range: [lower, upper] });
  }
  return [...rows.values()].sort((a, b) => a.start.localeCompare(b.start));
}

// Recharts draws plain SVG attributes, where CSS variables do not resolve: read the theme's
// tokens, again whenever the `dark` class of the page changes.
const watchTheme = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
};
const isDark = () => document.documentElement.classList.contains('dark');

function useChartColors() {
  const dark = useSyncExternalStore(watchTheme, isDark);
  return useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    const token = (name: string) => css.getPropertyValue(name).trim();
    return {
      dark,
      history: token('--secondary'),
      forecast: token('--primary'),
      grid: token('--line2'),
      text: token('--muted'),
    };
  }, [dark]);
}

function ChartTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: readonly { payload?: Row }[];
  unit: UnitRef;
}) {
  const row = active ? payload?.[0]?.payload : undefined;
  if (!row) return null;
  return (
    <div className="rounded-xl border border-line2 bg-surface px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-fg">Semana del {formatWeek(row.start)}</p>
      {row.demand !== null && (
        <p className="text-muted">
          Demanda{row.partial ? ' (en curso)' : ''}:{' '}
          <span className="font-medium text-fg">{formatQuantity(row.demand, unit)}</span>
        </p>
      )}
      {row.estimate !== null && row.range && (
        <p className="text-muted">
          Estimado:{' '}
          <span className="font-medium text-fg">{formatQuantity(row.estimate, unit)}</span> (entre{' '}
          {formatNumber(row.range[0])} y {formatNumber(row.range[1])})
        </p>
      )}
    </div>
  );
}

interface DemandForecastChartProps {
  history: DemandPeriod[];
  forecast: ForecastPeriod[];
  unit: UnitRef;
  /** What the chart shows, for screen readers. */
  summary: string;
}

/**
 * The weekly demand as bars (the week in progress paler) and, after it, the forecast: the
 * estimate as a dashed line inside its probable range.
 */
export function DemandForecastChart({
  history,
  forecast,
  unit,
  summary,
}: DemandForecastChartProps) {
  const colors = useChartColors();
  const rows = useMemo(() => toRows(history, forecast), [history, forecast]);
  const firstForecast = forecast[0]?.start;

  return (
    <div className="space-y-3">
      <div role="img" aria-label={summary} className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="start"
              tickFormatter={formatWeek}
              tick={{ fill: colors.text, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: colors.grid }}
              minTickGap={18}
            />
            <YAxis
              width={44}
              tickFormatter={(value: number) => formatNumber(value)}
              tick={{ fill: colors.text, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: colors.grid, fillOpacity: colors.dark ? 0.25 : 0.4 }}
              content={(props) => <ChartTooltip {...props} unit={unit} />}
            />
            {firstForecast && (
              <ReferenceLine
                x={firstForecast}
                stroke={colors.forecast}
                strokeOpacity={0.5}
                strokeDasharray="4 4"
                label={{
                  value: 'Pronóstico',
                  position: 'top',
                  fill: colors.forecast,
                  fontSize: 11,
                }}
              />
            )}
            <Bar dataKey="demand" maxBarSize={26} radius={[4, 4, 0, 0]} fill={colors.history}>
              {rows.map((row) => (
                <Cell key={row.start} fillOpacity={row.partial ? 0.4 : 1} />
              ))}
            </Bar>
            <Area
              dataKey="range"
              stroke="none"
              fill={colors.forecast}
              fillOpacity={colors.dark ? 0.25 : 0.16}
              activeDot={false}
            />
            <Line
              dataKey="estimate"
              stroke={colors.forecast}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={{ r: 3, fill: colors.forecast, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted" aria-hidden="true">
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-secondary" /> Demanda real
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-secondary/40" /> Semana en curso
        </li>
        {forecast.length > 0 && (
          <>
            <li className="flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed border-primary" /> Estimado
            </li>
            <li className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-primary/20" /> Rango probable
            </li>
          </>
        )}
      </ul>
    </div>
  );
}
