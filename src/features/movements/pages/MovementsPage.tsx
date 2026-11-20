import { useCallback, useMemo, useState } from 'react';
import { FiArrowRight, FiX } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import { movementTypeLabel } from '@/shared/lib/movementTypes';
import { Button } from '@/shared/ui/components/Button';
import { DatePicker } from '@/shared/ui/components/form/date/DatePicker';
import { Select } from '@/shared/ui/components/form/select/Select';
import type { SelectOption } from '@/shared/ui/components/form/select/select.types';
import { PageHeader } from '@/shared/ui/PageHeader';
import {
  useHistoryProducts,
  useHistoryWarehouses,
  useMovements,
  useMovementTypes,
} from '../api/movements.queries';
import { MovementDetailPanel } from '../components/MovementDetailPanel';
import { MovementsTable } from '../components/MovementsTable';
import { historyWarehouses } from '../content/movement.permissions';
import { movementsErrorMessage } from '../content/movements.errors';
import type { Movement, Option } from '../types/movements.types';

const ALL = 'all';

/**
 * US-014 / CU-05 A2: the movement history, most recent first, of every product or of one. The
 * product and the open movement live in the URL (`?product=12&movement=40`), so Inventario and
 * Productos link straight to a product's history.
 */
export default function MovementsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get('product');
  const openId = searchParams.get('movement');
  const setParam = useCallback(
    (key: string, value: string | null, replace = false) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace },
      ),
    [setSearchParams],
  );

  // Filters (A2: by dates or type; the API also takes the warehouse).
  const [warehouseFilter, setWarehouseFilter] = useState<string>(ALL);
  const [typeFilter, setTypeFilter] = useState<string>(ALL);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const movements = useMovements({
    productId,
    warehouseId: warehouseFilter === ALL ? null : warehouseFilter,
    typeId: typeFilter === ALL ? null : typeFilter,
    from: from || null,
    to: to || null,
    page,
    pageSize,
  });

  const reading = historyWarehouses(currentUser);
  const everyWarehouse = useHistoryWarehouses(reading === 'all');
  const warehouses: Option[] = reading === 'all' ? (everyWarehouse.data ?? []) : reading;
  const types = useMovementTypes();
  const canReadCatalog = hasAnyPermission(currentUser, ['catalog.read']);
  const canReadStock = hasAnyPermission(currentUser, ['stock.read']);
  const products = useHistoryProducts(canReadCatalog);
  const product = products.data?.find((p) => p.id === productId);

  const productOptions = useMemo<SelectOption[]>(
    () => [
      { value: ALL, label: 'Todos los productos' },
      // The code in the label: the search matches labels only.
      ...(products.data ?? []).map((p) => ({ value: p.id, label: `${p.name} · ${p.sku}` })),
    ],
    [products.data],
  );
  const typeOptions = useMemo<SelectOption[]>(
    () => [
      { value: ALL, label: 'Todos los tipos' },
      ...(types.data ?? [])
        .map((type) => ({ value: type.id, label: movementTypeLabel(type) }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es')),
    ],
    [types.data],
  );

  const filtered = warehouseFilter !== ALL || typeFilter !== ALL || !!from || !!to;
  const clearFilters = () => {
    setWarehouseFilter(ALL);
    setTypeFilter(ALL);
    setFrom('');
    setTo('');
    setPage(1);
  };
  const emptyMessage = filtered
    ? 'Ningún movimiento coincide con los filtros.'
    : productId
      ? 'Este producto aún no tiene movimientos.'
      : 'Aún no hay movimientos.';

  const open = useCallback((movement: Movement) => setParam('movement', movement.id), [setParam]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimientos"
        subtitle="Cada entrada y salida de inventario, con su fecha, quién la registró y de dónde vino. No se editan ni se borran."
      />

      <section aria-label="Filtros" className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {canReadCatalog && (
            <Select
              aria-label="Filtrar por producto"
              value={productId ?? ALL}
              onChange={(value) => {
                setParam('product', value && value !== ALL ? value : null);
                setPage(1);
              }}
              options={productOptions}
              searchable
              searchPlaceholder="Buscar por código o nombre…"
              emptyMessage="Ningún producto coincide"
              className="w-full lg:w-80"
            />
          )}
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
              className="w-full lg:w-56"
            />
          )}
          <Select
            aria-label="Filtrar por tipo"
            value={typeFilter}
            onChange={(value) => {
              setTypeFilter(value || ALL);
              setPage(1);
            }}
            options={typeOptions}
            className="w-full lg:w-56"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:items-center">
          <DatePicker
            aria-label="Desde"
            placeholder="Desde"
            value={from}
            max={to || undefined}
            onChange={(value) => {
              setFrom(value);
              setPage(1);
            }}
            clearable
            className="w-full sm:w-44"
          />
          <DatePicker
            aria-label="Hasta"
            placeholder="Hasta"
            value={to}
            min={from || undefined}
            onChange={(value) => {
              setTo(value);
              setPage(1);
            }}
            clearable
            className="w-full sm:w-44"
          />
          <div>
            {filtered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1.5 self-start sm:self-auto"
              >
                <FiX aria-hidden className="size-4" /> Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </section>

      {productId && product && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-fg">
            Movimientos de <strong>{product.name}</strong>{' '}
            <span className="text-muted">({product.sku})</span>
          </p>
          {canReadStock && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-primary"
              onClick={() => navigate(`/inventory?view=product&product=${productId}`)}
            >
              Ver su existencia en Inventario <FiArrowRight aria-hidden className="size-4" />
            </Button>
          )}
        </div>
      )}

      <MovementsTable
        movements={movements.data?.items ?? []}
        productId={productId}
        isLoading={movements.isLoading}
        isRefreshing={movements.isPlaceholderData}
        error={
          movements.error
            ? movementsErrorMessage(movements.error, 'No se pudieron cargar los movimientos.')
            : undefined
        }
        emptyMessage={emptyMessage}
        page={page}
        pageSize={pageSize}
        totalItems={movements.data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onOpen={open}
      />

      {openId && (
        <MovementDetailPanel movementId={openId} onClose={() => setParam('movement', null, true)} />
      )}
    </div>
  );
}
