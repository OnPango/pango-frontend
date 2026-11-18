import { useMemo } from 'react';
import { FiAlertTriangle, FiArrowRight, FiLayers } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { formatQuantity, unitLabel } from '@/shared/lib/units';
import type { Column } from '@/shared/types/dataTable';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { DataTable } from '@/shared/ui/components/DataTable';
import { useReplenishments } from '../api/inventory.queries';
import { ALERT_LABELS, SOURCE_LABELS } from '../content/replenishment.labels';
import type { StockAction, ProductStock, Replenishment } from '../types/inventory.types';
import { RowMovementActions } from './RowMovementActions';

type Row = ProductStock['warehouses'][number];

/** US-015: a product's total stock and how it splits across warehouses. */
export function ProductStockCard({
  stock,
  onOpenWarehouse,
  onRegister,
  onReplenish,
  onShowLots,
  historyHref,
}: {
  stock: ProductStock;
  /** With `movement.read`: the product's movement history, which adds up to the total. */
  historyHref?: string;
  onOpenWarehouse: (warehouseId: string) => void;
  /** Without `movement.create` there are no movement actions. */
  onRegister?: (kind: StockAction, warehouseId: string) => void;
  /** With `replenishment.manage`: edit the warehouse's safety stock and reorder point. */
  onReplenish?: (warehouseId: string) => void;
  /** The product's lots with stock in a warehouse, with their dates (per-lot products). */
  onShowLots: (warehouseId: string) => void;
}) {
  const { product } = stock;
  // The open alert of each row (it compares the reorder point with available stock).
  const replenishments = useReplenishments(
    product.id,
    stock.warehouses.map((row) => row.warehouse.id),
  );
  const alerts = useMemo(() => {
    const byWarehouse = new Map<string, Replenishment['openAlert']>();
    stock.warehouses.forEach((row, index) => {
      byWarehouse.set(row.warehouse.id, replenishments[index]?.data?.openAlert ?? null);
    });
    return byWarehouse;
  }, [stock.warehouses, replenishments]);

  const columns = useMemo<Column<Row>[]>(() => {
    const base: Column<Row>[] = [
      {
        key: 'warehouse',
        header: 'Almacén',
        cell: (row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenWarehouse(row.warehouse.id)}
            className="max-w-full justify-start truncate rounded-md p-0 text-left text-sm hover:bg-transparent hover:text-primary hover:underline"
            aria-label={`Ver los productos de ${row.warehouse.name}`}
          >
            {row.warehouse.name}
          </Button>
        ),
      },
      {
        key: 'onHand',
        header: 'Existencia',
        className: 'text-right',
        cell: (row) => {
          const alert = alerts.get(row.warehouse.id);
          return (
            <div className="flex flex-col items-end gap-1">
              <span
                className={`text-sm tabular-nums ${row.onHand === 0 ? 'text-muted' : 'font-semibold text-fg'}`}
              >
                {formatQuantity(row.onHand, product.unit)}
              </span>
              {alert && (
                <Badge
                  icon={FiAlertTriangle}
                  tone={alert.severity === 1 ? 'warning' : 'danger'}
                  size="sm"
                >
                  {ALERT_LABELS[alert.severity]}
                </Badge>
              )}
            </div>
          );
        },
      },
      ...(product.tracksLots
        ? [
            {
              key: 'lots',
              header: 'Lotes',
              cell: (row: Row) =>
                row.onHand > 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onShowLots(row.warehouse.id)}
                    aria-label={`Ver los lotes de ${product.name} en ${row.warehouse.name}`}
                    className="gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium"
                  >
                    <FiLayers aria-hidden className="size-3.5" />
                    Ver lotes
                  </Button>
                ) : (
                  <span className="text-sm text-muted">—</span>
                ),
            },
          ]
        : []),
      {
        key: 'safetyStock',
        header: 'Stock de seguridad',
        className: 'text-right',
        cell: (row) => (
          <span className="text-sm text-fg/90 tabular-nums">
            {formatQuantity(row.safetyStock, product.unit)}
          </span>
        ),
      },
      {
        key: 'reorderPoint',
        header: 'Punto de reorden',
        className: 'text-right',
        cell: (row) => (
          <div className="flex flex-col items-end">
            <span className="text-sm text-fg/90 tabular-nums">
              {row.reorderPoint === 0
                ? 'Sin definir'
                : formatQuantity(row.reorderPoint, product.unit)}
            </span>
            <span className="text-[11px] text-muted">{SOURCE_LABELS[row.source].label}</span>
          </div>
        ),
      },
    ];
    if (!onRegister && !onReplenish) return base;
    return [
      ...base,
      {
        key: 'actions',
        header: <span className="sr-only">Acciones</span>,
        className: 'text-right',
        cell: (row) => (
          <RowMovementActions
            subject={`${product.name} en ${row.warehouse.name}`}
            canAdd={product.isActive}
            canRemove={product.isActive && row.onHand > 0}
            onRegister={onRegister ? (kind) => onRegister(kind, row.warehouse.id) : undefined}
            onReplenish={onReplenish ? () => onReplenish(row.warehouse.id) : undefined}
          />
        ),
      },
    ];
  }, [onOpenWarehouse, onRegister, onReplenish, onShowLots, product, alerts]);

  return (
    <section aria-labelledby="stock-title" className="space-y-5 rounded-2xl">
      <div className="flex flex-col gap-4 rounded-2xl bg-sidebar-fg/10 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 id="stock-title" className="truncate text-xl font-bold text-fg">
            {product.name}
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>{product.sku}</span>
            <span aria-hidden>·</span>
            <span>{product.family}</span>
            <span aria-hidden>·</span>
            <span>Se cuenta en {unitLabel(product.unit).toLowerCase()}</span>
            {product.tracksLots && (
              <Badge icon={FiLayers} appearance="outline" size="sm" className="rounded-lg">
                Por lote
              </Badge>
            )}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold text-muted">Existencia total</p>
          <p className="text-3xl font-bold text-fg tabular-nums">
            {formatQuantity(stock.totalOnHand, product.unit)}
          </p>
        </div>
      </div>

      <DataTable<Row>
        caption={`Existencia de ${product.name} por almacén`}
        columns={columns}
        rows={stock.warehouses}
        getRowKey={(row) => row.warehouse.id}
        emptyMessage="Este producto aún no tiene existencia en ningún almacén. Regístrala con una entrada."
      />
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        El total es la suma de las entradas menos las salidas de todos los almacenes.
        {historyHref && (
          <Link
            to={historyHref}
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            Ver el historial de movimientos
            <FiArrowRight aria-hidden className="size-3.5" />
          </Link>
        )}
      </p>
    </section>
  );
}
