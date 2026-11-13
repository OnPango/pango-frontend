import { useMemo } from 'react';
import { formatQuantity } from '@/shared/lib/units';
import type { Column } from '@/shared/types/dataTable';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { DataTable } from '@/shared/ui/components/DataTable';
import { formatDate, STATUS_LABELS } from '../content/alert.labels';
import type { StockAlert } from '../types/alerts.types';
import { SeverityBadge } from './SeverityBadge';

export interface AlertsTableProps {
  alerts: StockAlert[];
  isLoading?: boolean;
  /** The rows are the previous query's while another filter or page loads. */
  isRefreshing?: boolean;
  error?: string;
  emptyMessage: string;
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onOpen: (alert: StockAlert) => void;
}

/** CU-12: product, available stock, reorder point, severity, status and date; most recent first. */
export function AlertsTable({
  alerts,
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
}: AlertsTableProps) {
  const columns = useMemo<Column<StockAlert>[]>(
    () => [
      {
        key: 'severity',
        skeleton: 'badge',
        header: 'Severidad',
        cell: (alert) => <SeverityBadge severity={alert.severity} />,
      },
      {
        key: 'product',
        skeleton: 'title',
        header: 'Producto',
        cell: (alert) => (
          <div className="min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpen(alert)}
              className="max-w-full justify-start truncate rounded-md p-0 text-left text-sm hover:bg-transparent hover:text-primary hover:underline"
              aria-label={`Ver la alerta de ${alert.product.name} en ${alert.warehouse.name}`}
            >
              {alert.product.name}
            </Button>
            <p className="text-xs text-muted">{alert.product.sku}</p>
          </div>
        ),
      },
      {
        key: 'warehouse',
        header: 'Almacén',
        cell: (alert) => <span className="text-sm text-fg/90">{alert.warehouse.name}</span>,
      },
      {
        key: 'stock',
        skeleton: 'title',
        header: 'Disponible / punto de reorden',
        cell: (alert) => (
          <div className="text-sm tabular-nums">
            <span className="font-semibold text-fg">
              {formatQuantity(alert.available, alert.product.unit)}
            </span>
            <span className="text-muted">
              {' '}
              / {formatQuantity(alert.reorderPoint, alert.product.unit)}
            </span>
            <p className="text-xs text-muted">al generarse</p>
          </div>
        ),
      },
      {
        key: 'status',
        skeleton: 'badge',
        header: 'Estado',
        cell: (alert) => (
          <div>
            <Badge tone={STATUS_LABELS[alert.status].tone} dot>
              {STATUS_LABELS[alert.status].label}
            </Badge>
            {alert.resolvedAt && (
              <p className="mt-1 text-xs text-muted">el {formatDate(alert.resolvedAt)}</p>
            )}
          </div>
        ),
      },
      {
        key: 'createdAt',
        header: 'Generada',
        cell: (alert) => (
          <span className="text-sm whitespace-nowrap text-fg/90">
            {formatDate(alert.createdAt, true)}
          </span>
        ),
      },
    ],
    [onOpen],
  );

  return (
    <DataTable<StockAlert>
      caption="Alertas de reposición"
      columns={columns}
      rows={alerts}
      getRowKey={(alert) => alert.id}
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
