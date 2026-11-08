import { useMemo } from 'react';
import { FiLayers } from 'react-icons/fi';
import { formatQuantity, unitLabel } from '@/shared/lib/units';
import type { Column } from '@/shared/types/dataTable';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { DataTable } from '@/shared/ui/components/DataTable';
import type { MovementKind, ProductStock } from '../types/inventory.types';
import { RowMovementActions } from './RowMovementActions';

type Row = ProductStock['warehouses'][number];

/** US-015: a product's total stock and how it splits across warehouses. */
export function ProductStockCard({
  stock,
  onOpenWarehouse,
  onRegister,
}: {
  stock: ProductStock;
  onOpenWarehouse: (warehouseId: string) => void;
  /** Without `movement.create` there are no row actions. */
  onRegister?: (kind: MovementKind, warehouseId: string) => void;
}) {
  const { product } = stock;

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
        cell: (row) => (
          <span
            className={`text-sm tabular-nums ${row.onHand === 0 ? 'text-muted' : 'font-semibold text-fg'}`}
          >
            {formatQuantity(row.onHand, product.unit)}
          </span>
        ),
      },
    ];
    if (!onRegister) return base;
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
            onRegister={(kind) => onRegister(kind, row.warehouse.id)}
          />
        ),
      },
    ];
  }, [onOpenWarehouse, onRegister, product]);

  return (
    <section
      aria-labelledby="stock-title"
      className="space-y-5 rounded-2xl border border-line2 bg-surface p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
      <p className="text-xs text-muted">
        El total es la suma de las entradas menos las salidas de todos los almacenes.
      </p>
    </section>
  );
}
