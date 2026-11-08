import { useMemo } from 'react';
import { FiLayers } from 'react-icons/fi';
import { TbHash } from 'react-icons/tb';
import { formatQuantity } from '@/shared/lib/units';
import type { Column } from '@/shared/types/dataTable';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { DataTable } from '@/shared/ui/components/DataTable';
import { usePagination } from '@/shared/ui/components/pagination/usePagination';
import type { MovementKind, WarehouseStockRow } from '../types/inventory.types';
import { RowMovementActions } from './RowMovementActions';

/** The products of one warehouse with their stock there. */
export function WarehouseStockTable({
  rows,
  warehouseName,
  isLoading,
  error,
  emptyMessage,
  onOpenProduct,
  onRegister,
}: {
  rows: WarehouseStockRow[];
  warehouseName: string;
  isLoading: boolean;
  error?: string;
  emptyMessage: string;
  onOpenProduct: (productId: string) => void;
  /** Without `movement.create` there are no row actions. */
  onRegister?: (kind: MovementKind, row: WarehouseStockRow) => void;
}) {
  const { page, pageSize, totalItems, pageItems, setPage, setPageSize } = usePagination(rows, 25);

  const columns = useMemo<Column<WarehouseStockRow>[]>(() => {
    const base: Column<WarehouseStockRow>[] = [
      {
        key: 'product',
        header: 'Producto',
        cell: ({ product }) => (
          <div className="min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenProduct(product.id)}
              className="max-w-full justify-start truncate rounded-md p-0 text-left text-sm hover:bg-transparent hover:text-primary hover:underline"
              aria-label={`Ver existencia de ${product.name} en todos los almacenes`}
            >
              {product.name}
            </Button>
            <p className="truncate text-xs text-muted">
              {product.sku}
              {!product.isActive && ' · archivado'}
            </p>
          </div>
        ),
      },
      {
        key: 'family',
        header: 'Familia',
        cell: ({ product }) => <span className="text-sm text-fg/90">{product.family}</span>,
      },
      {
        key: 'tracking',
        header: 'Seguimiento',
        cell: ({ product }) =>
          product.tracksLots ? (
            <Badge icon={FiLayers} appearance="outline" className="rounded-lg font-medium">
              Por lote
            </Badge>
          ) : (
            <Badge icon={TbHash} appearance="outline" className="rounded-lg font-medium">
              Solo cantidad
            </Badge>
          ),
      },
      {
        key: 'onHand',
        header: 'Existencia',
        className: 'text-right',
        cell: ({ product, onHand }) => (
          <span
            className={`text-sm tabular-nums ${onHand === 0 ? 'text-muted' : 'font-semibold text-fg'}`}
          >
            {formatQuantity(onHand, product.unit)}
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
          <RowActions row={row} warehouseName={warehouseName} onRegister={onRegister} />
        ),
      },
    ];
  }, [onOpenProduct, onRegister, warehouseName]);

  return (
    <DataTable<WarehouseStockRow>
      caption={`Existencia de los productos en ${warehouseName}`}
      columns={columns}
      rows={pageItems}
      getRowKey={(row) => row.product.id}
      isLoading={isLoading}
      error={error}
      emptyMessage={emptyMessage}
      pagination={{
        page,
        pageSize,
        totalItems,
        onPageChange: setPage,
        pageSizeOptions: [10, 25, 50],
        onPageSizeChange: setPageSize,
      }}
    />
  );
}

function RowActions({
  row,
  warehouseName,
  onRegister,
}: {
  row: WarehouseStockRow;
  warehouseName: string;
  onRegister: (kind: MovementKind, row: WarehouseStockRow) => void;
}) {
  return (
    <RowMovementActions
      subject={`${row.product.name} en ${warehouseName}`}
      canRemove={row.onHand > 0 && row.product.isActive}
      canAdd={row.product.isActive}
      onRegister={(kind) => onRegister(kind, row)}
    />
  );
}
