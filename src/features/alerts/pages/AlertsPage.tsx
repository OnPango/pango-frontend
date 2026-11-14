import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { SelectOption } from '@/shared/ui/components/form/select/select.types';
import { PageHeader } from '@/shared/ui/PageHeader';
import { useAlertProducts, useAlerts, useAlertWarehouses } from '../api/alerts.queries';
import { AlertDetailPanel } from '../components/AlertDetailPanel';
import { AlertsTable } from '../components/AlertsTable';
import { alertWarehouses, readsStockIn } from '../content/alert.permissions';
import { alertsErrorMessage } from '../content/alerts.errors';
import type { AlertSort, AlertStatus, Option, StockAlert } from '../types/alerts.types';

const ALL = 'all';

/** Pending first (what needs action); dismissing by hand comes in S6. */
const STATUS_OPTIONS: SelectOption[] = [
  { value: 'open', label: 'Pendientes' },
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas"
        subtitle="Se generan solas cuando el disponible de un producto en un almacén llega a su punto de reorden, se actualizan mientras siga bajo él y se resuelven cuando vuelve a superarlo."
      />

      <section aria-label="Filtros" className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          aria-label="Filtrar por estado"
          value={status}
          onChange={(value) => {
            setStatus(value || 'open');
            setPage(1);
          }}
          options={STATUS_OPTIONS}
          className="w-full sm:w-44"
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
            className="w-full sm:w-60"
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
            className="w-full sm:w-72"
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
          className="w-full sm:ml-auto sm:w-52"
        />
      </section>

      <AlertsTable
        alerts={alerts.data?.items ?? []}
        isLoading={alerts.isLoading}
        isRefreshing={alerts.isPlaceholderData}
        error={
          alerts.error
            ? alertsErrorMessage(alerts.error, 'No se pudieron cargar las alertas.')
            : undefined
        }
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

      {openId && (
        <AlertDetailPanel
          alertId={openId}
          readsStock={readsStock}
          onClose={close}
          onShowInventory={(alert) =>
            navigate(`/inventory?view=product&product=${alert.product.id}`)
          }
        />
      )}
    </div>
  );
}
