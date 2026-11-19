import { useState } from 'react';
import { FiBox } from 'react-icons/fi';
import { MdWarehouse } from 'react-icons/md';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import { Alert } from '@/shared/ui/components/Alert';
import { SegmentedControl } from '@/shared/ui/components/form/SegmentedControl';
import { PageHeader } from '@/shared/ui/PageHeader';
import {
  useForecastProducts,
  useForecastRuns,
  useForecastWarehouses,
  useLatestRun,
} from '../api/forecast.queries';
import { ForecastExplorer } from '../components/ForecastExplorer';
import { ForecastRunsTable } from '../components/ForecastRunsTable';
import { RunForecastModal } from '../components/RunForecastModal';
import { WarehouseForecastView } from '../components/WarehouseForecastView';
import { formatInstant } from '../content/forecast.labels';
import { forecastErrorMessage } from '../content/forecast.errors';
import { forecastWarehouses } from '../content/forecast.permissions';
import type { Option } from '../types/forecast.types';

type ForecastView = 'warehouse' | 'product';

const VIEWS = [
  { value: 'warehouse' as const, label: 'Por almacén', icon: MdWarehouse },
  { value: 'product' as const, label: 'Por producto', icon: FiBox },
];

/**
 * CU-10: the forecast of every product of a warehouse; the demand history and the forecasts of one
 * product (US-37, US-38, A1 and A2); and the forecast runs.
 */
export default function ForecastPage() {
  const user = useAuthStore((state) => state.user);
  const canRead = hasAnyPermission(user, ['forecast.read']);
  const canRun = hasAnyPermission(user, ['forecast.run']);
  const canReadCatalog = hasAnyPermission(user, ['catalog.read']);

  // Warehouses: those where the user reads forecasts; starting a run may target any of them.
  const reading = forecastWarehouses(user);
  const everyWarehouse = useForecastWarehouses(reading === 'all' || canRun);
  const warehouses: Option[] = reading === 'all' ? (everyWarehouse.data ?? []) : reading;
  const products = useForecastProducts(canRead && canReadCatalog);

  // What is open lives in the address, to share it or come back to it.
  const [searchParams, setSearchParams] = useSearchParams();
  const view: ForecastView = searchParams.get('view') === 'product' ? 'product' : 'warehouse';
  const productId = searchParams.get('product') ?? '';
  const warehouseId = searchParams.get('warehouse') ?? warehouses[0]?.id ?? '';
  const forecastId = searchParams.get('forecast') ?? '';
  const setParams = (values: Record<string, string>) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(values)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true },
    );

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const runs = useForecastRuns(page, pageSize, canRead);
  const latest = useLatestRun(canRead);
  const running = latest.data?.status === 'running' ? latest.data : null;
  const [isRunOpen, setRunOpen] = useState(false);

  const selectedProduct = products.data?.find((p) => p.id === productId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Predicción"
        subtitle="La demanda de cada producto semana a semana y lo que se espera en las próximas, calculado por el servicio de pronóstico."
        onAction={canRun ? () => setRunOpen(true) : undefined}
        actionText="Generar pronóstico"
      />

      {running && (
        <Alert tone="info" title={`Pronóstico en curso · ejecución #${running.id}`}>
          Se inició el {formatInstant(running.startedAt)} con {running.seriesTotal} series. Esta
          pantalla se actualiza sola cuando termine.
        </Alert>
      )}

      {canRead && (
        <>
          <SegmentedControl<ForecastView>
            legend="Ver el pronóstico"
            options={VIEWS}
            value={view}
            onChange={(next) => setParams({ view: next })}
          />
          {view === 'warehouse' ? (
            <WarehouseForecastView
              warehouses={warehouses}
              warehouseId={warehouseId}
              onWarehouseChange={(id) => setParams({ warehouse: id, forecast: '' })}
              onOpenProduct={(id) => setParams({ view: 'product', product: id, forecast: '' })}
            />
          ) : canReadCatalog ? (
            <ForecastExplorer
              products={products.data ?? []}
              productsLoading={products.isLoading}
              warehouses={warehouses}
              productId={productId}
              warehouseId={warehouseId}
              onProductChange={(id) => setParams({ product: id, forecast: '' })}
              onWarehouseChange={(id) => setParams({ warehouse: id, forecast: '' })}
              forecastId={forecastId}
              onForecastChange={(id) => setParams({ forecast: id })}
              canRun={canRun}
            />
          ) : (
            <Alert tone="info">
              Para ver la demanda y el pronóstico de un producto necesitas permiso para consultar el
              catálogo.
            </Alert>
          )}
        </>
      )}

      {canRead && (
        <section aria-labelledby="forecast-runs" className="space-y-3">
          <div>
            <h2 id="forecast-runs" className="text-lg font-bold text-fg">
              Ejecuciones
            </h2>
            <p className="text-sm text-muted">
              Cada ejecución pronostica las próximas semanas de los productos activos. Un pronóstico
              nuevo nunca borra los anteriores.
            </p>
          </div>
          <ForecastRunsTable
            runs={runs.data?.items ?? []}
            isLoading={runs.isLoading}
            isRefreshing={runs.isPlaceholderData}
            error={
              runs.error
                ? forecastErrorMessage(runs.error, 'No se pudieron cargar las ejecuciones.')
                : undefined
            }
            page={page}
            pageSize={pageSize}
            totalItems={runs.data?.total ?? 0}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </section>
      )}

      {isRunOpen && (
        <RunForecastModal
          warehouses={everyWarehouse.data ?? warehouses}
          product={selectedProduct ? { id: selectedProduct.id, name: selectedProduct.name } : null}
          running={running !== null}
          onClose={() => setRunOpen(false)}
        />
      )}
    </div>
  );
}
