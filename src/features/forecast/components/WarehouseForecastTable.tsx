import { useMemo } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { formatNumber, formatQuantity } from '@/shared/lib/units';
import type { Column } from '@/shared/types/dataTable';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { DataTable } from '@/shared/ui/components/DataTable';
import {
  DEMAND_CLASS,
  formatInstantDay,
  reasonShort,
  seriesErrorShort,
} from '../content/forecast.labels';
import type { WarehouseForecastRow } from '../types/forecast.types';

/** The coming weeks of a product: its current forecast, or why there is none. */
function Outlook({ row }: { row: WarehouseForecastRow }) {
  const { current, latest, product } = row;
  const failedSince = latest && latest !== current && latest.status === 'error';
  if (current?.total) {
    const weeks = current.periods.length;
    return (
      <div className="text-sm tabular-nums">
        <p className="font-semibold text-fg">
          {formatQuantity(current.total.estimate, product.unit)}
        </p>
        <p className="text-xs text-muted">
          Entre {formatNumber(current.total.lower)} y {formatNumber(current.total.upper)} · ≈{' '}
          {formatNumber(Math.round((current.total.estimate / weeks) * 10) / 10)} por semana
        </p>
        {failedSince && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-warning">
            <FiAlertTriangle aria-hidden className="size-3" /> El último intento falló
          </p>
        )}
      </div>
    );
  }
  if (!latest) return <span className="text-sm text-muted">Sin pronóstico todavía</span>;
  if (latest.status === 'no_forecast') {
    return <span className="text-sm text-muted">Omitido: {reasonShort(latest.reason)}</span>;
  }
  return (
    <span className="flex items-center gap-1.5 text-sm text-warning">
      <FiAlertTriangle aria-hidden className="size-3.5 shrink-0" />
      {seriesErrorShort(latest.error?.code)}
    </span>
  );
}

interface WarehouseForecastTableProps {
  rows: WarehouseForecastRow[];
  /** Weeks of the horizon, for the column header. */
  horizon: number | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error?: string;
  emptyMessage: string;
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onOpen: (row: WarehouseForecastRow) => void;
}

/** The products of a warehouse with what their forecast expects for the coming weeks. */
export function WarehouseForecastTable({
  rows,
  horizon,
  isLoading,
  isRefreshing,
  error,
  emptyMessage,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  onOpen,
}: WarehouseForecastTableProps) {
  const columns = useMemo<Column<WarehouseForecastRow>[]>(
    () => [
      {
        key: 'product',
        skeleton: 'title',
        header: 'Producto',
        cell: (row) => (
          <div className="min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpen(row)}
              className="max-w-full justify-start truncate rounded-md p-0 text-left text-sm hover:bg-transparent hover:text-primary hover:underline"
              aria-label={`Ver la demanda y el pronóstico de ${row.product.name}`}
            >
              {row.product.name}
            </Button>
            <p className="text-xs text-muted">{row.product.sku}</p>
          </div>
        ),
      },
      {
        key: 'outlook',
        skeleton: 'stack',
        header: horizon ? `Próximas ${horizon} semanas` : 'Próximas semanas',
        cell: (row) => <Outlook row={row} />,
      },
      {
        key: 'class',
        skeleton: 'badge',
        header: 'Demanda',
        cell: (row) => {
          const demandClass = row.current?.demandClass;
          return demandClass ? (
            <span title={DEMAND_CLASS[demandClass].description}>
              <Badge tone="secondary" size="sm">
                {DEMAND_CLASS[demandClass].label}
              </Badge>
            </span>
          ) : (
            <span className="text-sm text-muted">—</span>
          );
        },
      },
      {
        key: 'generated',
        header: 'Generado',
        cell: (row) =>
          row.current ? (
            <div className="text-sm whitespace-nowrap">
              <p className="text-fg/90">{formatInstantDay(row.current.createdAt)}</p>
              <p className="text-xs text-muted">Ejecución #{row.current.runId}</p>
            </div>
          ) : (
            <span className="text-sm text-muted">—</span>
          ),
      },
    ],
    [horizon, onOpen],
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.product.id}
      caption="Pronóstico de los productos del almacén"
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      error={error}
      emptyMessage={emptyMessage}
      pagination={{ page, pageSize, totalItems, onPageChange, onPageSizeChange }}
    />
  );
}
