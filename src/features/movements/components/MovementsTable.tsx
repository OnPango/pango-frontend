import { useMemo } from 'react';
import type { Column } from '@/shared/types/dataTable';
import { Button } from '@/shared/ui/components/Button';
import { DataTable } from '@/shared/ui/components/DataTable';
import { cn } from '@/shared/lib/cn';
import {
  formatDate,
  formatTime,
  productsSummary,
  requestNumberOf,
  signedQuantity,
  SOURCE_LABELS,
} from '../content/movement.labels';
import type { Movement } from '../types/movements.types';
import { MovementTypeLabel } from './MovementTypeLabel';

export interface MovementsTableProps {
  movements: Movement[];
  /** With a product chosen, the quantity is that product's and the product column goes away. */
  productId: string | null;
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: string;
  emptyMessage: string;
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onOpen: (movement: Movement) => void;
}

/** US-014: date, movement, type, quantity, warehouse, user and source; most recent first. */
export function MovementsTable({
  movements,
  productId,
  isLoading = false,
  isRefreshing = false,
  error,
  emptyMessage,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  onOpen,
}: MovementsTableProps) {
  const columns = useMemo<Column<Movement>[]>(() => {
    const linesOf = (movement: Movement) =>
      productId ? movement.lines.filter((line) => line.product.id === productId) : movement.lines;
    const all: (Column<Movement> | null)[] = [
      {
        key: 'occurredAt',
        header: 'Fecha',
        skeleton: 'title',
        cell: (movement) => (
          <div className="whitespace-nowrap">
            <p className="text-sm text-fg/90">{formatDate(movement.occurredAt)}</p>
            <p className="text-xs text-muted">{formatTime(movement.occurredAt)}</p>
          </div>
        ),
      },
      {
        key: 'number',
        header: 'Movimiento',
        cell: (movement) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpen(movement)}
            className="rounded-md p-0 text-sm whitespace-nowrap tabular-nums hover:bg-transparent hover:text-primary hover:underline"
            aria-label={`Ver el movimiento ${movement.number}`}
          >
            {movement.number}
          </Button>
        ),
      },
      {
        key: 'type',
        header: 'Tipo',
        cell: (movement) => <MovementTypeLabel type={movement.type} />,
      },
      productId
        ? null
        : {
            key: 'product',
            header: 'Producto',
            skeleton: 'title',
            cell: (movement) => (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">
                  {productsSummary(movement.lines)}
                </p>
                {movement.lines.length === 1 && (
                  <p className="text-xs text-muted">{movement.lines[0].product.sku}</p>
                )}
              </div>
            ),
          },
      {
        key: 'quantity',
        header: 'Cantidad',
        className: 'text-right',
        skeleton: 'title',
        cell: (movement) => {
          const lines = linesOf(movement);
          const products = new Set(lines.map((line) => line.product.id)).size;
          if (products > 1) {
            return <span className="text-sm text-muted">{products} productos</span>;
          }
          const quantity = signedQuantity(lines);
          const lots = [...new Set(lines.map((line) => line.lot).filter(Boolean))];
          return (
            <div className="text-right whitespace-nowrap">
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  quantity?.sign === 1 ? 'text-success' : 'text-danger',
                )}
              >
                {quantity?.text ?? '0'}
              </span>
              {lots.length > 0 && (
                <p className="text-xs text-muted">
                  {lots.length === 1 ? `Lote ${lots[0]}` : `${lots.length} lotes`}
                </p>
              )}
            </div>
          );
        },
      },
      {
        key: 'warehouse',
        header: 'Almacén',
        cell: (movement) => <span className="text-sm text-fg/90">{movement.warehouse.name}</span>,
      },
      {
        key: 'registeredBy',
        header: 'Registró',
        cell: (movement) => (
          <span className="text-sm text-fg/90">{movement.registeredBy ?? '—'}</span>
        ),
      },
      {
        key: 'source',
        header: 'Fuente',
        skeleton: 'title',
        cell: (movement) => {
          const request = requestNumberOf(movement);
          const detail = [request, movement.department?.name].filter(Boolean).join(' · ');
          return (
            <div className="min-w-0">
              <p className="text-sm text-fg/90">{SOURCE_LABELS[movement.source]}</p>
              {detail && <p className="text-xs text-muted tabular-nums">{detail}</p>}
            </div>
          );
        },
      },
    ];
    return all.filter((column): column is Column<Movement> => column !== null);
  }, [productId, onOpen]);

  return (
    <DataTable<Movement>
      caption="Historial de movimientos"
      columns={columns}
      rows={movements}
      getRowKey={(movement) => movement.id}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      error={error}
      emptyMessage={emptyMessage}
      pagination={{
        page,
        pageSize,
        totalItems,
        onPageChange,
        pageSizeOptions: [10, 25, 50],
        onPageSizeChange,
      }}
    />
  );
}
