import { useMemo } from 'react';
import { FiChevronRight, FiLayers } from 'react-icons/fi';
import { TbHash } from 'react-icons/tb';
import { formatQuantity } from '@/shared/lib/units';
import type { Column } from '@/shared/types/dataTable';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { DataTable } from '@/shared/ui/components/DataTable';
import { usePagination } from '@/shared/ui/components/pagination/usePagination';
import type { StockAction, WarehouseStockRow } from '../types/inventory.types';
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
  onReplenish,
  onShowLots,
  canTransfer = false,
}: {
  rows: WarehouseStockRow[];
  warehouseName: string;
  isLoading: boolean;
  error?: string;
  emptyMessage: string;
  onOpenProduct: (productId: string) => void;
  /** With another warehouse to send it to: the rows offer "Traslado". */
  canTransfer?: boolean;
  /** Without `movement.create` there are no movement actions. */
  onRegister?: (kind: StockAction, row: WarehouseStockRow) => void;
  /** With `replenishment.manage`: edit the row's safety stock and reorder point. */
  onReplenish?: (row: WarehouseStockRow) => void;
  /** The lots of a per-lot product with stock here, with their dates. */
  onShowLots: (row: WarehouseStockRow) => void;
}) {
  const { page, pageSize, totalItems, pageItems, setPage, setPageSize } = usePagination(rows, 25);

  const columns = useMemo<Column<WarehouseStockRow>[]>(() => {
    const base: Column<WarehouseStockRow>[] = [
      {
        key: 'product',
        skeleton: 'title',
        header: 'Producto',
        cell: ({ product }) => (
          <div className="min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenProduct(product.id)}
              className="max-w-full justify-start rounded-md p-0 text-left text-sm hover:bg-transparent hover:text-primary hover:underline"
              title={product.name}
              aria-label={`Ver existencia de ${product.name} en todos los almacenes`}
            >
              {/* The ellipsis needs a block box: the button itself is a flex container. */}
              <span className="min-w-0 truncate">{product.name}</span>
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
        skeleton: 'badge',
        header: 'Seguimiento',
        cell: (row) =>
          row.product.tracksLots && row.onHand > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShowLots(row)}
              aria-label={`Ver los lotes de ${row.product.name} en ${warehouseName}`}
              className="gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium"
            >
              <FiLayers aria-hidden className="size-3.5" />
              Por lote
              <FiChevronRight aria-hidden className="size-3.5" />
            </Button>
          ) : row.product.tracksLots ? (
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
      {
        key: 'available',
        header: 'Disponible',
        className: 'text-right',
        cell: ({ product, reserved, available }) => (
          <div className="flex flex-col items-end">
            <span className="text-sm text-fg/90 tabular-nums">
              {formatQuantity(available, product.unit)}
            </span>
            {reserved > 0 && (
              <span className="text-[11px] text-muted">
                {formatQuantity(reserved, product.unit)} reservado
              </span>
            )}
          </div>
        ),
      },
    ];
    if (!onRegister && !onReplenish) return base;
    return [
      ...base,
      {
        key: 'actions',
        skeleton: 'button',
        header: <span className="sr-only">Acciones</span>,
        className: 'text-right',
        cell: (row) => (
          <RowMovementActions
            subject={`${row.product.name} en ${warehouseName}`}
            canAdd={row.product.isActive}
            canRemove={row.available > 0 && row.product.isActive}
            onRegister={onRegister ? (kind) => onRegister(kind, row) : undefined}
            canTransfer={canTransfer}
            onReplenish={onReplenish ? () => onReplenish(row) : undefined}
          />
        ),
      },
    ];
  }, [onOpenProduct, onRegister, onReplenish, onShowLots, warehouseName, canTransfer]);

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
