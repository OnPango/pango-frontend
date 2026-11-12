import { useMemo } from 'react';
import type { Column } from '@/shared/types/dataTable';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { DataTable } from '@/shared/ui/components/DataTable';
import {
  formatDate,
  PRIORITY_LABELS,
  productsSummary,
  STATUS_LABELS,
  TYPE_LABELS,
} from '../content/request.labels';
import type { StockRequest } from '../types/requests.types';

export interface RequestsTableProps {
  requests: StockRequest[];
  isLoading?: boolean;
  error?: string;
  emptyMessage: string;
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  /** Id of the signed-in user: only the requester cancels, and only while pending. */
  currentUserId: string | null;
  onOpen: (request: StockRequest) => void;
  onCancel: (request: StockRequest) => void;
}

export function RequestsTable({
  requests,
  isLoading = false,
  error,
  emptyMessage,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  currentUserId,
  onOpen,
  onCancel,
}: RequestsTableProps) {
  const columns = useMemo<Column<StockRequest>[]>(
    () => [
      {
        key: 'number',
        header: 'Solicitud',
        cell: (request) => (
          <div className="min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpen(request)}
              className="justify-start rounded-md p-0 text-left text-sm tabular-nums hover:bg-transparent hover:text-primary hover:underline"
              aria-label={`Ver la solicitud ${request.number}`}
            >
              {request.number}
            </Button>
            <p className="text-xs text-muted">{TYPE_LABELS[request.type].label}</p>
            <p className="text-xs text-muted">{formatDate(request.createdAt, true)}</p>
          </div>
        ),
      },
      {
        key: 'department',
        header: 'Área',
        cell: (request) => <span className="text-sm text-fg/90">{request.department.name}</span>,
      },
      {
        key: 'warehouse',
        header: 'Almacén',
        cell: (request) => <span className="text-sm text-fg/90">{request.warehouse.name}</span>,
      },
      {
        key: 'products',
        header: 'Productos',
        cell: (request) => (
          <div className="min-w-0">
            <p className="truncate text-sm text-fg">
              {productsSummary(request.lines.map((line) => line.product.name))}
            </p>
            <p className="text-xs text-muted">
              {request.lines.length === 1 ? '1 producto' : `${request.lines.length} productos`}
              {request.requiredDate && ` · para el ${formatDate(request.requiredDate)}`}
            </p>
          </div>
        ),
      },
      {
        key: 'priority',
        header: 'Prioridad',
        cell: (request) => (
          <Badge
            appearance="outline"
            tone={request.priority === 1 ? 'danger' : 'neutral'}
            className="rounded-lg font-medium"
          >
            {PRIORITY_LABELS[request.priority]}
          </Badge>
        ),
      },
      {
        key: 'status',
        header: 'Estado',
        cell: (request) => (
          <Badge tone={STATUS_LABELS[request.status].tone} dot>
            {STATUS_LABELS[request.status].label}
          </Badge>
        ),
      },
      {
        key: 'requestedBy',
        header: 'Solicitada por',
        cell: (request) => (
          <span className="text-sm text-fg/90">
            {request.requestedBy.name ?? '—'}
            {request.requestedBy.id === currentUserId && (
              <span className="ml-1 text-xs text-muted">(tú)</span>
            )}
          </span>
        ),
      },
      {
        key: 'actions',
        header: <span className="sr-only">Acciones</span>,
        className: 'text-right',
        cell: (request) =>
          request.status === 'pending' && request.requestedBy.id === currentUserId ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancel(request)}
              className="text-xs text-danger hover:bg-danger/10"
              aria-label={`Cancelar la solicitud ${request.number}`}
            >
              Cancelar
            </Button>
          ) : null,
      },
    ],
    [currentUserId, onOpen, onCancel],
  );

  return (
    <DataTable<StockRequest>
      caption="Solicitudes internas"
      columns={columns}
      rows={requests}
      getRowKey={(request) => request.id}
      isLoading={isLoading}
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
