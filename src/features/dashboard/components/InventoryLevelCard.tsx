import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { Select } from '@/shared/ui/components/form/select/Select';
import { Skeleton } from '@/shared/ui/components/Skeleton';
import { useInventoryLevel } from '../api/dashboard.queries';
import { formatShortDay, LEVEL_OPTIONS } from '../content/dashboard.labels';
import type { LevelDays, LevelPoint } from '../types/dashboard.types';
import { DashboardCard, EmptyNote } from './DashboardCard';

const label = (point: LevelPoint, weekly: boolean) =>
  weekly ? `Sem. ${formatShortDay(point.start)}` : formatShortDay(point.end);

function LevelChart({ points, weekly }: { points: LevelPoint[]; weekly: boolean }) {
  const colors = useThemeColors();
  const showsLow = points.some((p) => p.lowStock !== null);
  // The theme swaps moss and copper in dark mode: stock stays moss, low stock copper.
  const stockColor = colors.dark ? colors.primary : colors.secondary;
  const lowColor = colors.dark ? colors.secondary : colors.primary;
  const data = points.map((p) => ({ ...p, label: label(p, weekly) }));
  const last = points.at(-1);
  const summary = last
    ? `Al ${formatShortDay(last.end)}: ${last.inStock} productos en stock${
        showsLow ? ` y ${last.lowStock} en stock bajo` : ''
      }.`
    : '';
  return (
    <div className="flex flex-1 flex-col gap-3">
      {/* Grows with the card (the row is as tall as the recent activity), never below 14rem. */}
      <div className="relative min-h-56 w-full flex-1" role="img" aria-label={summary}>
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barGap={2}>
              <CartesianGrid vertical={false} stroke={colors.line} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tick={{ fill: colors.muted, fontSize: 11 }}
                axisLine={{ stroke: colors.line }}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={12}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: colors.muted, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: colors.line, fillOpacity: colors.dark ? 0.25 : 0.4 }}
                contentStyle={{
                  background: colors.surface,
                  border: `1px solid ${colors.line}`,
                  borderRadius: 12,
                  fontSize: 12,
                  color: colors.fg,
                }}
                labelStyle={{ color: colors.fg, fontWeight: 600 }}
              />
              <Bar
                dataKey="inStock"
                name="Productos en stock"
                fill={stockColor}
                radius={[4, 4, 0, 0]}
                maxBarSize={22}
              />
              {showsLow && (
                <Bar
                  dataKey="lowStock"
                  name="Productos en stock bajo"
                  fill={lowColor}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={22}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <ul className="mt-auto flex flex-wrap gap-x-8 gap-y-1 text-xs text-fg" aria-hidden>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-secondary dark:bg-primary" /> Productos en stock
        </li>
        {showsLow && (
          <li className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-primary dark:bg-secondary" /> Productos en stock
            bajo
          </li>
        )}
      </ul>
    </div>
  );
}

/**
 * Products with stock, and in low stock, at the end of each day (or week, for 90 days). Each
 * product counts once; one in low stock is not counted again as in stock.
 */
export function InventoryLevelCard({
  warehouseId,
  className,
}: {
  warehouseId: string | null;
  className?: string;
}) {
  const [days, setDays] = useState<LevelDays>(7);
  const level = useInventoryLevel(warehouseId, days, true);
  return (
    <DashboardCard
      title="Nivel de inventario"
      className={className}
      aside={
        <Select
          aria-label="Periodo del nivel de inventario"
          value={String(days)}
          onChange={(value) => setDays((Number(value) || 7) as LevelDays)}
          options={LEVEL_OPTIONS.map((option) => ({
            value: String(option.value),
            label: option.label,
          }))}
          size="sm"
          className="w-44 shrink-0"
        />
      }
    >
      {level.isError && !level.data ? (
        <EmptyNote>No se pudo cargar el nivel de inventario.</EmptyNote>
      ) : level.data ? (
        <div aria-busy={level.isFetching || undefined} className="flex flex-1 flex-col">
          <LevelChart points={level.data.points} weekly={level.data.granularity === 'week'} />
        </div>
      ) : (
        <Skeleton className="min-h-64 w-full flex-1" />
      )}
    </DashboardCard>
  );
}
