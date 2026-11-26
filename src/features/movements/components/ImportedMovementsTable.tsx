import { useMemo } from 'react';
import type { Column } from '@/shared/types/dataTable';
import { cn } from '@/shared/lib/cn';
import { formatQuantity, type UnitRef } from '@/shared/lib/units';
import { Badge } from '@/shared/ui/components/Badge';
import { DataTable } from '@/shared/ui/components/DataTable';
import { formatBusinessDay, IMPORTED_CODE_LABELS } from '../content/movement.labels';
import type { ImportedMovement } from '../types/movements.types';

export interface ImportedMovementsTableProps {
  movements: ImportedMovement[];
  /** With a product chosen, the product column goes away. */
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
}

const unitOf = (movement: ImportedMovement): UnitRef => ({
  code: movement.product.unit,
  name: movement.product.unit,
});

/**
 * The history imported from the company's previous system: date, type, product, quantity, balance
 * the file gave, warehouse and where it came from. It is read-only and never changed stock.
 */
export function ImportedMovementsTable({
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
}: ImportedMovementsTableProps) {
  const columns = useMemo<Column<ImportedMovement>[]>(() => {
    const all: (Column<ImportedMovement> | null)[] = [
      {
        key: 'date',
        header: 'Fecha',
        cell: (m) => (
          <span className="text-sm whitespace-nowrap text-fg/90">{formatBusinessDay(m.date)}</span>
        ),
      },
      {
        key: 'type',
        header: 'Tipo',
        cell: (m) => (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm text-fg/90">{IMPORTED_CODE_LABELS[m.code] ?? m.code}</span>
            {m.afterCutover && (
              <Badge tone="warning" size="sm">
                No cuenta
              </Badge>
            )}
          </div>
        ),
      },
      productId
        ? null
        : {
            key: 'product',
            header: 'Producto',
            skeleton: 'title',
            cell: (m) => (
              // Imported names can be long and have no spaces to break at: cap the column and cut them.
              <div className="max-w-56 min-w-0 sm:max-w-xs xl:max-w-sm" title={m.product.name}>
                <p className="truncate text-sm font-semibold text-fg">{m.product.name}</p>
                <p className="truncate text-xs text-muted">{m.product.sku}</p>
              </div>
            ),
          },
      {
        key: 'quantity',
        header: 'Cantidad',
        className: 'text-right',
        skeleton: 'title',
        cell: (m) => {
          const inbound = m.quantityIn !== null;
          const quantity = (inbound ? m.quantityIn : m.quantityOut) ?? 0;
          return (
            <div className="text-right whitespace-nowrap">
              <span
                className={cn(
                  'text-sm font-semibold tabular-nums',
                  inbound ? 'text-success' : 'text-danger',
                )}
              >
                {inbound ? '+' : '−'}
                {formatQuantity(quantity, unitOf(m))}
              </span>
              {m.lotCode && <p className="text-xs text-muted">Lote {m.lotCode}</p>}
            </div>
          );
        },
      },
      {
        key: 'balance',
        header: 'Saldo',
        className: 'text-right',
        cell: (m) => (
          <span className="text-sm whitespace-nowrap text-fg/90 tabular-nums">
            {m.balance === null ? '—' : formatQuantity(m.balance, unitOf(m))}
          </span>
        ),
      },
      {
        key: 'warehouse',
        header: 'Almacén',
        cell: (m) => <span className="text-sm text-fg/90">{m.warehouse.name}</span>,
      },
      {
        key: 'source',
        header: 'Origen',
        skeleton: 'title',
        cell: (m) => (
          <div className="min-w-0">
            <p className="text-sm text-fg/90 tabular-nums">
              {m.documentRef ?? m.source.movementId}
              {m.source.line > 1 && <span className="text-muted"> · línea {m.source.line}</span>}
            </p>
            <p className="text-xs text-muted">
              {m.source.system} · carga #{m.source.importId}
            </p>
          </div>
        ),
      },
    ];
    return all.filter((column): column is Column<ImportedMovement> => column !== null);
  }, [productId]);

  return (
    <DataTable
      caption="Movimientos importados del sistema anterior"
      columns={columns}
      rows={movements}
      getRowKey={(m) => m.id}
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
