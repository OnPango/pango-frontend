import { useMemo, useState } from 'react';
import { formatQuantity } from '@/shared/lib/units';
import { Alert } from '@/shared/ui/components/Alert';
import { SegmentedControl } from '@/shared/ui/components/form/SegmentedControl';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { SelectOption } from '@/shared/ui/components/form/select/select.types';
import { Skeleton } from '@/shared/ui/components/Skeleton';
import { useDemand, useProductForecasts } from '../api/forecast.queries';
import { formatInstantDay, formatWeek, isCurrentWeek, weeksAgo } from '../content/forecast.labels';
import { forecastErrorMessage } from '../content/forecast.errors';
import type { DemandPeriod, Forecast, Option } from '../types/forecast.types';
import { DemandForecastChart } from './DemandForecastChart';
import { ForecastSummary, type ForecastCheck } from './ForecastSummary';

type Range = '12' | '26' | '52';

const RANGES = [
  { value: '12' as const, label: '3 meses' },
  { value: '26' as const, label: '6 meses' },
  { value: '52' as const, label: '1 año' },
];

interface ForecastExplorerProps {
  products: (Option & { sku: string })[];
  productsLoading: boolean;
  warehouses: Option[];
  productId: string;
  warehouseId: string;
  onProductChange: (id: string) => void;
  onWarehouseChange: (id: string) => void;
  /** An earlier forecast chosen to look back at (CU-10 A2); empty for the current one. */
  forecastId: string;
  onForecastChange: (id: string) => void;
  canRun: boolean;
}

/** The weeks of `forecast` that have already closed, against the demand they actually had. */
function checkAgainst(forecast: Forecast, history: DemandPeriod[]): ForecastCheck | null {
  const actualByWeek = new Map(history.map((period) => [period.start, period.quantity]));
  const closed = forecast.periods.filter(
    (period) => !isCurrentWeek(period.start) && actualByWeek.has(period.start),
  );
  if (closed.length === 0) return null;
  return {
    weeks: closed.length,
    actual: closed.reduce((sum, period) => sum + (actualByWeek.get(period.start) ?? 0), 0),
    estimated: Math.round(closed.reduce((sum, period) => sum + period.estimate, 0) * 10) / 10,
  };
}

/** US-37 and US-38: the weekly demand of a product in a warehouse and its forecast after it. */
export function ForecastExplorer({
  products,
  productsLoading,
  warehouses,
  productId,
  warehouseId,
  onProductChange,
  onWarehouseChange,
  forecastId,
  onForecastChange,
  canRun,
}: ForecastExplorerProps) {
  const [range, setRange] = useState<Range>('26');
  const forecasts = useProductForecasts(productId, warehouseId);
  const latest = forecasts.data?.[0];
  const current = forecasts.data?.find((f) => f.status === 'ok' && f.isCurrent);
  const successful = useMemo(
    () => (forecasts.data ?? []).filter((f) => f.status === 'ok'),
    [forecasts.data],
  );
  const shown = successful.find((f) => f.id === forecastId) ?? current;

  // The history reaches back to the forecast on the chart, to set it against what happened.
  const shownStart = shown?.periods[0]?.start;
  const rangeStart = weeksAgo(Number(range));
  const from = shownStart && shownStart < rangeStart ? shownStart : rangeStart;
  const demand = useDemand(productId, warehouseId, from);

  const productOptions = useMemo<SelectOption[]>(
    () => products.map((p) => ({ value: p.id, label: `${p.name} · ${p.sku}` })),
    [products],
  );
  const series = demand.data;
  const check = shown && series && shown !== current ? checkAgainst(shown, series.periods) : null;
  const forecastOptions = useMemo<SelectOption[]>(
    () =>
      successful.map((f) => ({
        value: f.id,
        label: `${formatInstantDay(f.createdAt)}${f.isCurrent ? ' · vigente' : ''}`,
        description: `Ejecución #${f.runId} · desde la semana del ${formatWeek(f.periods[0]?.start ?? f.historyEnd)}`,
      })),
    [successful],
  );
  const productName = products.find((p) => p.id === productId)?.name ?? '';
  const warehouseName = warehouses.find((w) => w.id === warehouseId)?.name ?? '';

  const summary =
    series && series.periods.length > 0
      ? `Demanda semanal de ${productName} en ${warehouseName}: ${formatQuantity(series.total, series.product.unit)} en ${series.periods.length} semanas` +
        (shown?.total
          ? `. Pronóstico de ${shown.periods.length} semanas: ${formatQuantity(shown.total.estimate, series.product.unit)}.`
          : '.')
      : '';

  return (
    <section
      aria-labelledby="forecast-explorer"
      className="flex min-w-0 flex-col gap-5 rounded-2xl border border-line bg-surface p-5 shadow-xs sm:p-6"
    >
      <div>
        <h2 id="forecast-explorer" className="text-lg font-bold text-fg">
          Demanda y pronóstico por producto
        </h2>
        <p className="text-sm text-muted">
          Semana a semana: lo que se vendió o se consumió en solicitudes, y lo que se espera
          después.
        </p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Select
          aria-label="Producto"
          value={productId}
          onChange={onProductChange}
          options={productOptions}
          placeholder={productsLoading ? 'Cargando productos…' : 'Elige un producto'}
          searchable
          searchPlaceholder="Buscar por código o nombre…"
          emptyMessage="Ningún producto coincide"
          disabled={productsLoading}
          className="w-full lg:w-80"
        />
        {warehouses.length > 1 && (
          <Select
            aria-label="Almacén"
            value={warehouseId}
            onChange={(value) => value && onWarehouseChange(value)}
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            searchable={warehouses.length > 8}
            searchPlaceholder="Buscar almacén…"
            emptyMessage="Ningún almacén coincide"
            className="w-full lg:w-60"
          />
        )}
        <SegmentedControl
          legend="Historia a mostrar"
          options={RANGES}
          value={range}
          onChange={setRange}
          className="lg:ml-auto"
        />
      </div>

      {!productId ? (
        <p className="rounded-2xl border border-dashed border-line2 px-6 py-12 text-center text-sm text-muted">
          Elige un producto para ver su demanda semanal y el pronóstico de las próximas semanas.
        </p>
      ) : demand.error ? (
        <Alert tone="danger">
          {forecastErrorMessage(demand.error, 'No se pudo cargar la demanda del producto.')}
        </Alert>
      ) : (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0">
            {!series || forecasts.isLoading ? (
              <Skeleton className="h-72 w-full rounded-2xl" />
            ) : series.noHistory ? (
              <p className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-line2 px-6 text-center text-sm text-muted">
                Este producto no tiene demanda registrada en este almacén: ni ventas ni consumos de
                solicitudes atendidas.
              </p>
            ) : (
              <div className={demand.isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
                <DemandForecastChart
                  history={series.periods}
                  forecast={shown?.periods ?? []}
                  unit={series.product.unit}
                  summary={summary}
                />
              </div>
            )}
          </div>
          <aside aria-label="Resumen del pronóstico">
            {forecasts.isLoading || !series ? (
              <Skeleton className="h-48 w-full rounded-2xl" />
            ) : forecasts.error ? (
              <Alert tone="danger">
                {forecastErrorMessage(forecasts.error, 'No se pudieron cargar los pronósticos.')}
              </Alert>
            ) : (
              <div className="space-y-3">
                {successful.length > 1 && (
                  <Select
                    label="Pronóstico"
                    value={shown?.id ?? ''}
                    onChange={(value) => onForecastChange(value === current?.id ? '' : value)}
                    options={forecastOptions}
                    hint="Los anteriores se comparan con lo que pasó después."
                  />
                )}
                <ForecastSummary
                  latest={latest}
                  current={current}
                  shown={shown}
                  check={check}
                  unit={series.product.unit}
                  canRun={canRun}
                />
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
