import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { FiArrowDownLeft, FiArrowUpRight, FiBox, FiSearch } from 'react-icons/fi';
import { MdWarehouse } from 'react-icons/md';
import { useAuthStore } from '@/core/auth/auth.store';
import { hasAnyPermission } from '@/core/auth/permissions';
import { formatQuantity, unitLabel } from '@/shared/lib/units';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { SegmentedControl } from '@/shared/ui/components/form/SegmentedControl';
import { Select } from '@/shared/ui/components/form/select/Select';
import { Switch } from '@/shared/ui/components/form/Switch';
import { TextBox } from '@/shared/ui/components/form/TextBox';
import { Skeleton } from '@/shared/ui/components/Skeleton';
import { Spinner } from '@/shared/ui/components/Spinner';
import { PageHeader } from '@/shared/ui/PageHeader';
import {
  productStockQuery,
  useActiveProducts,
  useProductStock,
  useStockWarehouses,
  useWarehouseStock,
} from '../api/inventory.queries';
import { MovementModal } from '../components/MovementModal';
import { ReplenishmentModal, type ReplenishmentTarget } from '../components/ReplenishmentModal';
import { ProductStockCard } from '../components/ProductStockCard';
import { WarehouseStockTable } from '../components/WarehouseStockTable';
import { inventoryErrorMessage } from '../content/inventory.errors';
import { KIND_LABELS } from '../content/movement.labels';
import { ALERT_LABELS } from '../content/replenishment.labels';
import { useInventoryView, type InventoryView } from '../hooks/useInventoryView';
import type {
  MovementKind,
  RegisteredMovement,
  Replenishment,
  WarehouseStockRow,
} from '../types/inventory.types';

const VIEWS = [
  { value: 'warehouse' as const, label: 'Por almacén', icon: MdWarehouse },
  { value: 'product' as const, label: 'Por producto', icon: FiBox },
];

const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/** What the movement form opens with. */
type MovementDraft = { kind: MovementKind; productId: string | null; warehouseId: string | null };

function EmptyPrompt({ children }: { children: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-line2 px-6 py-10 text-center text-sm text-muted">
      {children}
    </p>
  );
}

export default function InventoryPage() {
  const currentUser = useAuthStore((state) => state.user);
  const canRegister = hasAnyPermission(currentUser, ['movement.create']);
  const canReplenish = hasAnyPermission(currentUser, ['replenishment.manage']);
  const canReadMovements = hasAnyPermission(currentUser, ['movement.read']);
  const queryClient = useQueryClient();

  const warehouses = useStockWarehouses();
  const products = useActiveProducts();
  const {
    view,
    setView,
    warehouseId,
    productId,
    setWarehouseId,
    setProductId,
    showWarehouse,
    showProduct,
  } = useInventoryView(warehouses.data);

  const productStock = useProductStock(view === 'product' ? productId : null);
  const warehouseStock = useWarehouseStock(view === 'warehouse' ? warehouseId : null);

  const [search, setSearch] = useState('');
  const [showZero, setShowZero] = useState(false);
  const [draft, setDraft] = useState<MovementDraft | null>(null);
  const [replenishing, setReplenishing] = useState<ReplenishmentTarget | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const warehouseName = warehouses.data?.find((warehouse) => warehouse.id === warehouseId)?.name;

  const allRows = useMemo(() => warehouseStock.data ?? [], [warehouseStock.data]);
  const withStock = useMemo(
    () => (showZero ? allRows : allRows.filter((row) => row.onHand !== 0)),
    [allRows, showZero],
  );
  const visibleRows = useMemo(() => {
    const words = plain(search).split(/\s+/).filter(Boolean);
    if (words.length === 0) return withStock;
    return withStock.filter(({ product }) => {
      const haystack = plain(`${product.sku} ${product.name} ${product.family}`);
      return words.every((word) => haystack.includes(word));
    });
  }, [withStock, search]);

  const productOptions = useMemo(
    () =>
      (products.data ?? []).map((product) => ({
        value: product.id,
        label: `${product.name} · ${product.sku}`,
        description: unitLabel(product.unit),
      })),
    [products.data],
  );
  const warehouseOptions = (warehouses.data ?? []).map((warehouse) => ({
    value: warehouse.id,
    label: warehouse.name,
    description: warehouse.code,
  }));

  const register = (next: MovementDraft) => {
    setNotice(null);
    setDraft(next);
  };

  const registerFromWarehouseRow = useCallback(
    (kind: MovementKind, row: WarehouseStockRow) =>
      register({ kind, productId: row.product.id, warehouseId }),
    [warehouseId],
  );
  const registerFromProductRow = useCallback(
    (kind: MovementKind, rowWarehouseId: string) =>
      register({ kind, productId, warehouseId: rowWarehouseId }),
    [productId],
  );

  const replenishFromWarehouseRow = useCallback(
    (row: WarehouseStockRow) => {
      if (!warehouseId) return;
      setNotice(null);
      setReplenishing({
        productId: row.product.id,
        productName: row.product.name,
        unit: row.product.unit,
        warehouseId,
        warehouseName: warehouseName ?? 'este almacén',
      });
    },
    [warehouseId, warehouseName],
  );
  const stockData = productStock.data;
  const replenishFromProductRow = useCallback(
    (rowWarehouseId: string) => {
      if (!stockData) return;
      setNotice(null);
      setReplenishing({
        productId: stockData.product.id,
        productName: stockData.product.name,
        unit: stockData.product.unit,
        warehouseId: rowWarehouseId,
        warehouseName:
          stockData.warehouses.find((row) => row.warehouse.id === rowWarehouseId)?.warehouse.name ??
          '',
      });
    },
    [stockData],
  );

  // US-016, third criterion: the next alerts use the new values; say what that means right now.
  const handleReplenished = (target: ReplenishmentTarget, saved: Replenishment) => {
    setReplenishing(null);
    const amount = (value: number) => formatQuantity(value, target.unit);
    const outcome =
      saved.reorderPoint === 0
        ? 'Sin punto de reorden: no habrá alertas.'
        : saved.openAlert
          ? `Disponible ${amount(saved.available)} ≤ punto de reorden ${amount(saved.reorderPoint)}: alerta abierta (${ALERT_LABELS[saved.openAlert.severity].toLowerCase()}).`
          : `Disponible ${amount(saved.available)} > punto de reorden ${amount(saved.reorderPoint)}: sin alerta.`;
    setNotice(
      `Reposición de «${target.productName}» en ${target.warehouseName} guardada. ${outcome}`,
    );
  };

  // CU-05 step 7: confirm and show the new stock of the product in that warehouse. The
  // confirmation shows at once; the new stock is added when it arrives (the API can be slow).
  const handleSaved = async (movement: RegisteredMovement) => {
    setDraft(null);
    if (view === 'product') setProductId(movement.productId);
    else setWarehouseId(movement.warehouse.id);
    const confirmed = `${KIND_LABELS[movement.kind].noun} ${movement.number} registrada.`;
    setNotice(confirmed);
    try {
      const fresh = await queryClient.query(productStockQuery(movement.productId));
      const here = fresh.warehouses.find((row) => row.warehouse.id === movement.warehouse.id);
      const withStock =
        `${confirmed} Existencia de «${fresh.product.name}» en ${movement.warehouse.name}: ` +
        `${formatQuantity(here?.onHand ?? 0, fresh.product.unit)}.`;
      // Only if nothing else replaced the notice meanwhile.
      setNotice((current) => (current === confirmed ? withStock : current));
    } catch {
      // The movement is registered; the stock shows up in the list when it loads.
    }
  };

  const warehouseEmptyMessage =
    allRows.length === 0
      ? 'Este almacén aún no tiene productos. Regístralos con una entrada.'
      : withStock.length === 0
        ? 'No hay productos con existencia en este almacén. Activa «Mostrar productos en cero» para ver los agotados.'
        : 'Ningún producto coincide con la búsqueda.';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        subtitle="Consulta cuánto hay de cada producto y en qué almacén, y registra lo que entra y lo que sale."
      />

      {notice && (
        <Alert tone="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl<InventoryView>
          legend="Ver la existencia"
          options={VIEWS}
          value={view}
          onChange={setView}
        />
        {canRegister && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() =>
                register({
                  kind: 'inbound',
                  productId: view === 'product' ? productId : null,
                  warehouseId: view === 'warehouse' ? warehouseId : null,
                })
              }
              className="gap-2"
            >
              <FiArrowDownLeft aria-hidden className="size-4" />
              {KIND_LABELS.inbound.title}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                register({
                  kind: 'outbound',
                  productId: view === 'product' ? productId : null,
                  warehouseId: view === 'warehouse' ? warehouseId : null,
                })
              }
              className="gap-2"
            >
              <FiArrowUpRight aria-hidden className="size-4" />
              {KIND_LABELS.outbound.title}
            </Button>
          </div>
        )}
      </div>

      {view === 'warehouse' ? (
        <section aria-label="Existencia por almacén" className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <Select
              label="Almacén"
              value={warehouseId ?? ''}
              onChange={setWarehouseId}
              options={warehouseOptions}
              placeholder={warehouses.isLoading ? 'Cargando almacenes…' : 'Elige un almacén'}
              searchable
              searchPlaceholder="Buscar almacén…"
              emptyMessage="Ningún almacén coincide"
              className="lg:w-72"
            />
            {warehouseId && (
              <>
                <TextBox
                  type="search"
                  aria-label="Buscar en este almacén"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por código, nombre o familia…"
                  leadingIcon={FiSearch}
                  containerClassName="flex-1"
                />
                <Switch
                  label="Mostrar productos en cero"
                  checked={showZero}
                  onChange={(e) => setShowZero(e.target.checked)}
                  className="lg:pb-2.5"
                />
              </>
            )}
          </div>

          {!warehouseId ? (
            <EmptyPrompt>Elige un almacén para ver sus productos y su existencia.</EmptyPrompt>
          ) : (
            <>
              {warehouseStock.isLoading && (
                // Its place while the stock loads, so the table does not jump down afterwards.
                <div className="py-0.75">
                  <Skeleton className="w-64" />
                </div>
              )}
              {warehouseStock.data && (
                <p className="text-sm text-muted" aria-live="polite">
                  {withStock.length === 1
                    ? '1 producto'
                    : `${withStock.length.toLocaleString('es-CO')} productos`}
                  {showZero ? '' : ' con existencia'} en {warehouseName ?? 'este almacén'}.
                </p>
              )}
              <WarehouseStockTable
                rows={visibleRows}
                warehouseName={warehouseName ?? 'este almacén'}
                isLoading={warehouseStock.isLoading}
                error={
                  warehouseStock.error
                    ? inventoryErrorMessage(
                        warehouseStock.error,
                        'No se pudo cargar la existencia del almacén.',
                      )
                    : undefined
                }
                emptyMessage={warehouseEmptyMessage}
                onOpenProduct={showProduct}
                onRegister={canRegister ? registerFromWarehouseRow : undefined}
                onReplenish={canReplenish ? replenishFromWarehouseRow : undefined}
              />
            </>
          )}
        </section>
      ) : (
        <section aria-label="Existencia por producto" className="space-y-4">
          <Select
            label="Producto"
            value={productId ?? ''}
            onChange={setProductId}
            options={productOptions}
            placeholder={products.isLoading ? 'Cargando productos…' : 'Busca por código o nombre'}
            searchable
            searchPlaceholder="Código o nombre…"
            emptyMessage="Ningún producto coincide"
            className="lg:max-w-xl"
          />
          {!productId ? (
            <EmptyPrompt>Elige un producto para ver su existencia total y por almacén.</EmptyPrompt>
          ) : productStock.isLoading ? (
            <div className="flex items-center gap-2 px-2 py-6 text-sm text-muted" role="status">
              <Spinner className="size-4" /> Cargando existencia…
            </div>
          ) : productStock.error ? (
            <Alert tone="danger">
              {inventoryErrorMessage(productStock.error, 'No se pudo cargar la existencia.')}
            </Alert>
          ) : productStock.data ? (
            <ProductStockCard
              stock={productStock.data}
              onOpenWarehouse={showWarehouse}
              onRegister={canRegister ? registerFromProductRow : undefined}
              onReplenish={canReplenish ? replenishFromProductRow : undefined}
              historyHref={canReadMovements ? `/movements?product=${productId}` : undefined}
            />
          ) : null}
        </section>
      )}

      <ReplenishmentModal
        target={replenishing}
        onClose={() => setReplenishing(null)}
        onSaved={handleReplenished}
      />

      <MovementModal
        kind={draft?.kind ?? null}
        products={products.data ?? []}
        initialProductId={draft?.productId ?? null}
        initialWarehouseId={draft?.warehouseId ?? null}
        onClose={() => setDraft(null)}
        onSaved={(movement) => void handleSaved(movement)}
      />
    </div>
  );
}
