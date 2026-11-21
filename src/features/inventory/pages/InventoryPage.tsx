import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import {
  FiArrowDownLeft,
  FiArrowRight,
  FiArrowUpRight,
  FiBox,
  FiClipboard,
  FiRepeat,
  FiSearch,
  FiTruck,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
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
  useIncomingTransfers,
  useProductStock,
  useStockWarehouses,
  useWarehouseStock,
} from '../api/inventory.queries';
import { AdjustmentModal, type AdjustmentTarget } from '../components/AdjustmentModal';
import { MovementModal } from '../components/MovementModal';
import { ReplenishmentModal, type ReplenishmentTarget } from '../components/ReplenishmentModal';
import { LotsPanel, type LotsTarget } from '../components/LotsPanel';
import { ProductStockCard } from '../components/ProductStockCard';
import { TransferModal, type TransferTarget } from '../components/TransferModal';
import { WarehouseStockTable } from '../components/WarehouseStockTable';
import { inventoryErrorMessage } from '../content/inventory.errors';
import { adjustedText, KIND_LABELS, registeredText } from '../content/movement.labels';
import { ALERT_LABELS } from '../content/replenishment.labels';
import { useInventoryView, type InventoryView } from '../hooks/useInventoryView';
import type {
  MovementKind,
  RegisteredMovement,
  Replenishment,
  StockAction,
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
  // A lot's dates are part of the product: `PATCH /products/:id/lots/:lotId` asks for `product.manage`.
  const canEditLots = hasAnyPermission(currentUser, ['product.manage']);
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
  const [adjusting, setAdjusting] = useState<AdjustmentTarget | null>(null);
  const [transferring, setTransferring] = useState<TransferTarget | null>(null);
  const [replenishing, setReplenishing] = useState<ReplenishmentTarget | null>(null);
  const [showingLots, setShowingLots] = useState<LotsTarget | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const warehouseName = warehouses.data?.find((warehouse) => warehouse.id === warehouseId)?.name;
  /** A transfer needs somewhere else to go. */
  const canTransfer = canRegister && (warehouses.data?.length ?? 0) > 1;
  // CU-16: transfers on their way here wait for someone to receive them (in Movimientos).
  const incoming = useIncomingTransfers(
    view === 'warehouse' && warehouseId && canReadMovements ? warehouseId : null,
  );

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

  const register = (kind: StockAction, target: AdjustmentTarget) => {
    setNotice(null);
    if (kind === 'adjustment') setAdjusting(target);
    else if (kind === 'transfer') setTransferring(target);
    else setDraft({ kind, ...target });
  };
  /** From the header: the product or warehouse being looked at, the other one to choose. */
  const registerHere = (kind: StockAction) =>
    register(kind, {
      productId: view === 'product' ? productId : null,
      warehouseId: view === 'warehouse' ? warehouseId : null,
    });

  const registerFromWarehouseRow = useCallback(
    (kind: StockAction, row: WarehouseStockRow) =>
      register(kind, { productId: row.product.id, warehouseId }),
    [warehouseId],
  );
  const registerFromProductRow = useCallback(
    (kind: StockAction, rowWarehouseId: string) =>
      register(kind, { productId, warehouseId: rowWarehouseId }),
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

  const lotsFromWarehouseRow = useCallback(
    (row: WarehouseStockRow) => {
      if (!warehouseId) return;
      setShowingLots({
        product: row.product,
        warehouse: { id: warehouseId, name: warehouseName ?? 'este almacén' },
      });
    },
    [warehouseId, warehouseName],
  );
  const lotsFromProductRow = useCallback(
    (rowWarehouseId: string) => {
      const row = stockData?.warehouses.find((item) => item.warehouse.id === rowWarehouseId);
      if (!stockData || !row) return;
      setShowingLots({ product: stockData.product, warehouse: row.warehouse });
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
    setAdjusting(null);
    setTransferring(null);
    if (view === 'product') setProductId(movement.productId);
    else setWarehouseId(movement.warehouse.id);
    const confirmed = registeredText(movement);
    setNotice(confirmed);
    // With several products there is no single stock to show; the lists refresh on their own.
    if (movement.productIds.length > 1) return;
    try {
      const fresh = await queryClient.query(productStockQuery(movement.productId));
      const here = fresh.warehouses.find((row) => row.warehouse.id === movement.warehouse.id);
      const amount = (value: number) => formatQuantity(value, fresh.product.unit);
      const adjusted =
        movement.kind === 'adjustment'
          ? ` ${adjustedText(movement.removes, movement.quantity, amount(movement.quantity), true)}.`
          : '';
      const withStock =
        `${confirmed}${adjusted} Existencia de «${fresh.product.name}» en ${movement.warehouse.name}: ` +
        `${amount(here?.onHand ?? 0)}.`;
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
        subtitle="Consulta cuánto hay de cada producto y en qué almacén, registra lo que entra, lo que sale y lo que pasa de un almacén a otro, y corrige la existencia con un conteo."
      />

      {notice && (
        <Alert tone="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Alert>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SegmentedControl<InventoryView>
          legend="Ver la existencia"
          options={VIEWS}
          value={view}
          onChange={setView}
        />
        {canRegister && (
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap md:justify-end">
            <Button variant="primary" onClick={() => registerHere('inbound')} className="gap-2">
              <FiArrowDownLeft aria-hidden className="size-4" />
              {KIND_LABELS.inbound.title}
            </Button>
            <Button variant="outline" onClick={() => registerHere('outbound')} className="gap-2">
              <FiArrowUpRight aria-hidden className="size-4" />
              {KIND_LABELS.outbound.title}
            </Button>
            <Button variant="outline" onClick={() => registerHere('adjustment')} className="gap-2">
              <FiClipboard aria-hidden className="size-4" />
              Registrar ajuste
            </Button>
            {canTransfer && (
              <Button variant="outline" onClick={() => registerHere('transfer')} className="gap-2">
                <FiRepeat aria-hidden className="size-4" />
                Registrar traslado
              </Button>
            )}
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

          {warehouseId && (incoming.data ?? 0) > 0 && (
            <div
              role="status"
              className="flex flex-col gap-2 rounded-2xl border border-secondary/30 bg-secondary/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="flex items-center gap-2 text-sm text-fg">
                <FiTruck aria-hidden className="size-4 shrink-0 text-secondary" />
                {incoming.data === 1
                  ? `Hay 1 traslado en camino a ${warehouseName ?? 'este almacén'}.`
                  : `Hay ${incoming.data} traslados en camino a ${warehouseName ?? 'este almacén'}.`}{' '}
                Su existencia se suma cuando lo reciban.
              </p>
              <Link
                to="/movements?view=incoming"
                className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-secondary hover:underline sm:self-auto"
              >
                Ver y recibir <FiArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
          )}
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
                canTransfer={canTransfer}
                onReplenish={canReplenish ? replenishFromWarehouseRow : undefined}
                onShowLots={lotsFromWarehouseRow}
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
              canTransfer={canTransfer}
              onReplenish={canReplenish ? replenishFromProductRow : undefined}
              onShowLots={lotsFromProductRow}
              historyHref={canReadMovements ? `/movements?product=${productId}` : undefined}
            />
          ) : null}
        </section>
      )}

      {showingLots && (
        <LotsPanel
          target={showingLots}
          canEditDates={canEditLots}
          onClose={() => setShowingLots(null)}
        />
      )}

      <ReplenishmentModal
        target={replenishing}
        onClose={() => setReplenishing(null)}
        onSaved={handleReplenished}
      />

      <AdjustmentModal
        target={adjusting}
        products={products.data ?? []}
        onClose={() => setAdjusting(null)}
        onSaved={(movement) => void handleSaved(movement)}
      />

      <TransferModal
        target={transferring}
        products={products.data ?? []}
        onClose={() => setTransferring(null)}
        onSaved={(movement) => void handleSaved(movement)}
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
