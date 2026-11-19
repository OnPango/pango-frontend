import { useMemo, useState } from 'react';
import { formatQuantity } from '@/shared/lib/units';
import { Alert } from '@/shared/ui/components/Alert';
import { SegmentedControl } from '@/shared/ui/components/form/SegmentedControl';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { SelectOption } from '@/shared/ui/components/form/select/select.types';
import { Skeleton } from '@/shared/ui/components/Skeleton';
import { useDemand, useProductForecasts } from '../api/forecast.queries';
import { weeksAgo } from '../content/forecast.labels';
import { forecastErrorMessage } from '../content/forecast.errors';
import type { Option } from '../types/forecast.types';
import { DemandForecastChart } from './DemandForecastChart';
import { ForecastSummary } from './ForecastSummary';

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
  canRun: boolean;
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
  canRun,
}: ForecastExplorerProps) {
  const [range, setRange] = useState<Range>('26');
  const from = useMemo(() => weeksAgo(Number(range)), [range]);
  const demand = useDemand(productId, warehouseId, from);
  const forecasts = useProductForecasts(productId, warehouseId);

  const productOptions = useMemo<SelectOption[]>(
    () => products.map((p) => ({ value: p.id, label: `${p.name} · ${p.sku}` })),
    [products],
  );
  const latest = forecasts.data?.[0];
  const current = forecasts.data?.find((f) => f.status === 'ok' && f.isCurrent);
  const series = demand.data;
  const productName = products.find((p) => p.id === productId)?.name ?? '';
  const warehouseName = warehouses.find((w) => w.id === warehouseId)?.name ?? '';

  const summary =
    series && series.periods.length > 0
      ? `Demanda semanal de ${productName} en ${warehouseName}: ${formatQuantity(series.total, series.product.unit)} en ${series.periods.length} semanas` +
        (current?.total
          ? `. Pronóstico de las próximas ${current.periods.length} semanas: ${formatQuantity(current.total.estimate, series.product.unit)}.`
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
                  forecast={current?.periods ?? []}
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
              <ForecastSummary
                latest={latest}
                current={current}
                unit={series.product.unit}
                canRun={canRun}
              />
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
