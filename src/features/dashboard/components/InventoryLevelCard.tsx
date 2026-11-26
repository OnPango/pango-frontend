import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useThemeColors } from '@/shared/hooks/useThemeColors';
import { Select } from '@/shared/ui/components/form/select/Select';
import { Skeleton } from '@/shared/ui/components/Skeleton';
import { Badge } from '@/shared/ui/components/Badge';
import { useImportedLevel, useInventoryLevel } from '../api/dashboard.queries';
import { formatDay, LEVEL_OPTIONS } from '../content/dashboard.labels';
import { joinLevels, type LevelRow } from '../lib/levels';
import type { LevelDays } from '../types/dashboard.types';
import { DashboardCard, EmptyNote } from './DashboardCard';

const IMPORTED_OPACITY = 0.4;

function LevelTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: readonly { payload?: LevelRow }[];
}) {
  const row = active ? payload?.[0]?.payload : undefined;
  if (!row) return null;
  const imported = row.importedInStock > 0 || (row.importedLowStock ?? 0) > 0;
  return (
    <div className="rounded-xl border border-line2 bg-surface px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-fg">{row.label}</p>
      <p className="text-muted">
        En stock: <span className="font-medium text-fg">{row.inStock}</span>
        {row.lowStock !== null && (
          <>
            {' '}
            · stock bajo: <span className="font-medium text-fg">{row.lowStock}</span>
          </>
        )}
      </p>
      {imported && (
        <p className="mt-1 text-muted">
          <span className="font-semibold text-fg">Datos importados</span>: en stock{' '}
          <span className="font-medium text-fg">{row.importedInStock}</span>
          {row.importedLowStock !== null && (
            <>
              {' '}
              · stock bajo <span className="font-medium text-fg">{row.importedLowStock}</span>
            </>
          )}
        </p>
      )}
    </div>
  );
}

function LevelChart({ rows }: { rows: LevelRow[] }) {
  const colors = useThemeColors();
  const showsLow = rows.some((p) => p.lowStock !== null);
  const showsImported = rows.some((p) => p.importedInStock > 0 || (p.importedLowStock ?? 0) > 0);
  // The theme swaps moss and copper in dark mode: stock stays moss, low stock copper.
  const stockColor = colors.dark ? colors.primary : colors.secondary;
  const lowColor = colors.dark ? colors.secondary : colors.primary;
  const last = rows.at(-1);
  const summary = last
    ? `Al ${last.label}: ${last.inStock} productos en stock${
        showsLow ? ` y ${last.lowStock} en stock bajo` : ''
      }.${showsImported ? ' Incluye datos importados del sistema anterior, mostrados aparte.' : ''}`
    : '';
  return (
    <div className="flex flex-1 flex-col gap-3">
      {/* Grows with the card (the row is as tall as the recent activity), never below 14rem. */}
      <div className="relative min-h-56 w-full flex-1" role="img" aria-label={summary}>
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barGap={2}>
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
                content={(props) => <LevelTooltip {...props} />}
              />
              <Bar
                dataKey="inStock"
                stackId="stock"
                name="Productos en stock"
                fill={stockColor}
                radius={showsImported ? undefined : [4, 4, 0, 0]}
                maxBarSize={22}
              />
              {showsImported && (
                <Bar
                  dataKey="importedInStock"
                  stackId="stock"
                  name="Productos en stock (importado)"
                  fill={stockColor}
                  fillOpacity={IMPORTED_OPACITY}
                  stroke={stockColor}
                  strokeDasharray="3 2"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={22}
                />
              )}
              {showsLow && (
                <Bar
                  dataKey="lowStock"
                  stackId="low"
                  name="Productos en stock bajo"
                  fill={lowColor}
                  radius={showsImported ? undefined : [4, 4, 0, 0]}
                  maxBarSize={22}
                />
              )}
              {showsLow && showsImported && (
                <Bar
                  dataKey="importedLowStock"
                  stackId="low"
                  name="Productos en stock bajo (importado)"
                  fill={lowColor}
                  fillOpacity={IMPORTED_OPACITY}
                  stroke={lowColor}
                  strokeDasharray="3 2"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={22}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <ul className="mt-auto flex flex-wrap gap-x-6 gap-y-1 text-xs text-fg" aria-hidden>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-secondary dark:bg-primary" /> Productos en stock
        </li>
        {showsLow && (
          <li className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-primary dark:bg-secondary" /> Productos en stock
            bajo
          </li>
        )}
        {showsImported && (
          <li className="flex items-center gap-2">
            <span className="size-3 rounded-full border border-dashed border-fg/60 bg-fg/20" />{' '}
            Datos importados (más claros)
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
  const imported = useImportedLevel(warehouseId, days, true);
  const importedLevel = imported.data ?? null;
  const rows = level.data
    ? joinLevels(level.data.points, importedLevel?.points, level.data.granularity === 'week')
    : [];
  const includesImported = rows.some((p) => p.importedInStock > 0 || (p.importedLowStock ?? 0) > 0);
  return (
    <DashboardCard
      title="Nivel de inventario"
      className={className}
      description={
        includesImported && importedLevel?.lastImportedDay
          ? `Incluye datos importados del sistema anterior, hasta el ${formatDay(importedLevel.lastImportedDay)}.`
          : undefined
      }
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
          {includesImported && (
            <Badge tone="secondary" size="sm" className="mb-2 self-start">
              Incluye datos importados
            </Badge>
          )}
          <LevelChart rows={rows} />
        </div>
      ) : (
        <Skeleton className="min-h-64 w-full flex-1" />
      )}
    </DashboardCard>
  );
}
