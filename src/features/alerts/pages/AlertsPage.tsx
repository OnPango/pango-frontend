import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import { useListView } from '@/shared/hooks/useListView';
import { CardGrid } from '@/shared/ui/components/CardGrid';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { SelectOption } from '@/shared/ui/components/form/select/select.types';
import { ViewModeToggle } from '@/shared/ui/components/ViewModeToggle';
import { Alert } from '@/shared/ui/components/Alert';
import { PageHeader } from '@/shared/ui/PageHeader';
import {
  useAlertProducts,
  useAlerts,
  useAlertWarehouses,
  useSetAlertStatus,
} from '../api/alerts.queries';
import { AlertCard } from '../components/AlertCard';
import { AlertDetailPanel } from '../components/AlertDetailPanel';
import { AttendAlertDialog } from '../components/AttendAlertDialog';
import { AlertsTable } from '../components/AlertsTable';
import { alertWarehouses, readsStockIn, resolvesAlertsIn } from '../content/alert.permissions';
import { alertsErrorMessage } from '../content/alerts.errors';
import type {
  AlertManualStatus,
  AlertSort,
  AlertStatus,
  Option,
  StockAlert,
} from '../types/alerts.types';

const ALL = 'all';

/** Pending first (what needs action), then attended (someone took charge, still in force). */
const STATUS_OPTIONS: SelectOption[] = [
  { value: 'open', label: 'Pendientes' },
  { value: 'attended', label: 'Atendidas' },
  { value: 'resolved', label: 'Resueltas' },
  { value: ALL, label: 'Todas' },
];

const SORT_OPTIONS: SelectOption[] = [
  { value: 'created', label: 'Más recientes', description: 'Las que se generaron último' },
  {
    value: 'updated',
    label: 'Cambios recientes',
    description: 'Incluye las que empeoraron o se resolvieron',
  },
  { value: 'severity', label: 'Más graves primero', description: 'Críticas, altas y medias' },
];

/** CU-12 / US-044: the organization's replenishment alerts, most recent first by default. */
export default function AlertsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get('alert');

  // Filters (CU-12 A1: by status or product; the API also takes the warehouse).
  const [status, setStatus] = useState<string>('open');
  const [sort, setSort] = useState<AlertSort>('created');
  const [warehouseFilter, setWarehouseFilter] = useState<string>(ALL);
  const [productFilter, setProductFilter] = useState<string>(ALL);
  const { view, setView } = useListView('pango.alerts.view', 'cards');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const alerts = useAlerts({
    status: status === ALL ? null : (status as AlertStatus),
    sort,
    warehouseId: warehouseFilter === ALL ? null : warehouseFilter,
    productId: productFilter === ALL ? null : productFilter,
    page,
    pageSize,
  });

  // Warehouses: those where the user reads alerts; the filter only shows with more than one.
  const reading = alertWarehouses(currentUser);
  const everyWarehouse = useAlertWarehouses(reading === 'all');
  const warehouses: Option[] = reading === 'all' ? (everyWarehouse.data ?? []) : reading;
  const canReadCatalog = hasAnyPermission(currentUser, ['catalog.read']);
  const products = useAlertProducts(canReadCatalog);
  const productOptions = useMemo<SelectOption[]>(
    () => [
      { value: ALL, label: 'Todos los productos' },
      ...(products.data ?? []).map((product) => ({
        value: product.id,
        // The code in the label: the search matches labels only.
        label: `${product.name} · ${product.sku}`,
      })),
    ],
    [products.data],
  );

  const filtered = warehouseFilter !== ALL || productFilter !== ALL;
  const emptyMessage =
    status === 'open' && !filtered
      ? 'No hay alertas pendientes. Se generan solas cuando el disponible de un producto llega a su punto de reorden.'
      : filtered || status !== ALL
        ? 'Ninguna alerta coincide con los filtros.'
        : 'Aún no se ha generado ninguna alerta.';

  const open = useCallback(
    (alert: StockAlert) =>
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('alert', alert.id);
        return next;
      }),
    [setSearchParams],
  );
  const close = () =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('alert');
        return next;
      },
      { replace: true },
    );
  const readsStock = useCallback(
    (warehouseId: string) => readsStockIn(currentUser, warehouseId),
    [currentUser],
  );
  const resolvesIn = useCallback(
    (warehouseId: string) => resolvesAlertsIn(currentUser, warehouseId),
    [currentUser],
  );

  // US-045, from a card (the detail panel has its own): attending asks first, going back to
  // pending does not.
  const statusChange = useSetAlertStatus();
  const [attending, setAttending] = useState<StockAlert | null>(null);
  const changeStatus = (alert: StockAlert, next: AlertManualStatus) => {
    if (next === 'attended') {
      statusChange.reset();
      setAttending(alert);
    } else {
      statusChange.mutate({ id: alert.id, status: next });
    }
  };
  const savingId = statusChange.isPending ? statusChange.variables.id : null;

  const showInventory = (alert: StockAlert) =>
    navigate(`/inventory?view=product&product=${alert.product.id}`);
  const loadError = alerts.error
    ? alertsErrorMessage(alerts.error, 'No se pudieron cargar las alertas.')
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas"
        subtitle="Se generan solas cuando el disponible de un producto en un almacén llega a su punto de reorden, se actualizan mientras siga bajo él y se resuelven cuando vuelve a superarlo."
      />

      <section
        aria-label="Filtros"
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <Select
          aria-label="Filtrar por estado"
          value={status}
          onChange={(value) => {
            setStatus(value || 'open');
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          className="w-full sm:w-44 xl:w-40"
        />
        {warehouses.length > 1 && (
          <Select
            aria-label="Filtrar por almacén"
            value={warehouseFilter}
            onChange={(value) => {
              setWarehouseFilter(value || ALL);
              setPage(1);
            }}
            options={[
              { value: ALL, label: 'Todos los almacenes' },
              ...warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name })),
            ]}
            searchable
            searchPlaceholder="Buscar almacén…"
            emptyMessage="Ningún almacén coincide"
            className="w-full sm:w-60 xl:w-50"
          />
        )}
        {canReadCatalog && (
          <Select
            aria-label="Filtrar por producto"
            value={productFilter}
            onChange={(value) => {
              setProductFilter(value || ALL);
              setPage(1);
            }}
            options={productOptions}
            searchable
            searchPlaceholder="Buscar por código o nombre…"
            emptyMessage="Ningún producto coincide"
            className="w-full sm:w-72 xl:w-60"
          />
        )}
        <Select
          aria-label="Ordenar alertas"
          value={sort}
          onChange={(value) => {
            setSort((value || 'created') as AlertSort);
            setPage(1);
          }}
          options={SORT_OPTIONS}
          className="w-full sm:ml-auto sm:w-52 xl:w-44"
        />
        <ViewModeToggle legend="Ver las alertas como" value={view} onChange={setView} />
      </section>

      {statusChange.isError && (
        <Alert tone="danger">
          {alertsErrorMessage(statusChange.error, 'No se pudo cambiar el estado de la alerta.')}
        </Alert>
      )}

      {view === 'table' ? (
        <AlertsTable
          alerts={alerts.data?.items ?? []}
          isLoading={alerts.isLoading}
          isRefreshing={alerts.isPlaceholderData}
          error={loadError}
          emptyMessage={emptyMessage}
          page={page}
          pageSize={pageSize}
          totalItems={alerts.data?.total ?? 0}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onOpen={open}
        />
      ) : (
        <CardGrid<StockAlert>
          ariaLabel="Alertas"
          items={alerts.data?.items ?? []}
          getItemKey={(alert) => alert.id}
          isLoading={alerts.isLoading}
          skeletonCount={4}
          skeletonClassName="h-36"
          className="gap-3 sm:grid-cols-1 xl:grid-cols-1"
          error={loadError}
          emptyMessage={emptyMessage}
          pagination={{
            page,
            pageSize,
            totalItems: alerts.data?.total ?? 0,
            onPageChange: setPage,
            pageSizeOptions: [10, 25, 50],
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1);
            },
          }}
          renderItem={(alert) => (
            <AlertCard
              alert={alert}
              onOpen={open}
              onShowInventory={readsStock(alert.warehouse.id) ? showInventory : undefined}
              onSetStatus={resolvesIn(alert.warehouse.id) ? changeStatus : undefined}
              isSaving={savingId === alert.id}
            />
          )}
        />
      )}

      {attending && <AttendAlertDialog alert={attending} onClose={() => setAttending(null)} />}

      {openId && (
        <AlertDetailPanel
          alertId={openId}
          readsStock={readsStock}
          resolvesIn={resolvesIn}
          onClose={close}
          onShowInventory={showInventory}
        />
      )}
    </div>
  );
}
