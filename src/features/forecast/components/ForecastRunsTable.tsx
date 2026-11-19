import { useMemo } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import type { Column } from '@/shared/types/dataTable';
import { Badge } from '@/shared/ui/components/Badge';
import { DataTable } from '@/shared/ui/components/DataTable';
import { Spinner } from '@/shared/ui/components/Spinner';
import {
  formatDay,
  formatDuration,
  formatInstant,
  RUN_STATUS,
  runOutcome,
} from '../content/forecast.labels';
import type { ForecastRun } from '../types/forecast.types';

const STATUS_ICONS = {
  completed: FiCheckCircle,
  partial: FiAlertTriangle,
  failed: FiXCircle,
} as const;

export function RunStatusBadge({ run }: { run: ForecastRun }) {
  const { label, tone } = RUN_STATUS[run.status];
  if (run.status === 'running') {
    return (
      <Badge tone={tone} size="sm" className="gap-1.5">
        <Spinner className="size-3" />
        {label}
      </Badge>
    );
  }
  return (
    <Badge tone={tone} size="sm" icon={STATUS_ICONS[run.status]}>
      {label}
    </Badge>
  );
}

interface ForecastRunsTableProps {
  runs: ForecastRun[];
  isLoading: boolean;
  isRefreshing: boolean;
  error?: string;
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

/** The forecast runs, most recent first: status, the history they used and what came out. */
export function ForecastRunsTable({
  runs,
  isLoading,
  isRefreshing,
  error,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: ForecastRunsTableProps) {
  const columns = useMemo<Column<ForecastRun>[]>(
    () => [
      {
        key: 'run',
        skeleton: 'stack',
        header: 'Ejecución',
        cell: (run) => (
          <div className="text-sm">
            <p className="font-semibold text-fg">#{run.id}</p>
            <p className="text-xs whitespace-nowrap text-muted">{formatInstant(run.startedAt)}</p>
          </div>
        ),
      },
      {
        key: 'status',
        skeleton: 'badge',
        header: 'Estado',
        cell: (run) => <RunStatusBadge run={run} />,
      },
      {
        key: 'outcome',
        skeleton: 'text',
        header: 'Resultado',
        cell: (run) =>
          run.status === 'running' ? (
            <span className="text-sm text-muted">Procesando {run.seriesTotal} series…</span>
          ) : run.status === 'failed' ? (
            <span className="line-clamp-2 text-sm text-danger" title={run.errorMessage ?? ''}>
              {run.errorMessage ?? 'El servicio de pronóstico no respondió.'} No se guardó nada.
            </span>
          ) : (
            <span className="text-sm text-fg/90">{runOutcome(run)}</span>
          ),
      },
      {
        key: 'history',
        header: 'Datos hasta',
        cell: (run) => (
          <span className="text-sm whitespace-nowrap text-fg/90">{formatDay(run.historyEnd)}</span>
        ),
      },
      {
        key: 'by',
        header: 'Iniciado por',
        cell: (run) => (
          <div className="text-sm">
            <p className="text-fg/90">{run.startedBy ?? '—'}</p>
            {run.finishedAt && (
              <p className="text-xs text-muted">
                Tardó {formatDuration(run.startedAt, run.finishedAt)}
              </p>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      rows={runs}
      getRowKey={(run) => run.id}
      caption="Ejecuciones del pronóstico"
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      error={error}
      emptyMessage="Aún no se ha generado ningún pronóstico."
      pagination={{ page, pageSize, totalItems, onPageChange, onPageSizeChange }}
    />
  );
}
