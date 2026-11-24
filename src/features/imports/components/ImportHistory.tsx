import { useMemo, useState } from 'react';
import { Badge } from '@/shared/ui/components/Badge';
import { DataTable } from '@/shared/ui/components/DataTable';
import { SegmentedControl } from '@/shared/ui/components/form/SegmentedControl';
import type { Column } from '@/shared/types/dataTable';
import { formatCount } from '../lib/format';
import { KIND_NAME, STATUS_LABEL, STATUS_TONE } from '../content/imports.labels';
import type { ImportRecord } from '../types/imports.types';

type Filter = 'all' | 'inventory' | 'movements';

const date = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const COLUMNS: Column<ImportRecord>[] = [
  { key: 'date', header: 'Fecha', cell: (r) => date(r.date), skeleton: 'text' },
  { key: 'kind', header: 'Tipo', cell: (r) => KIND_NAME[r.kind], skeleton: 'text' },
  {
    key: 'file',
    header: 'Archivo',
    cell: (r) => <span className="break-all">{r.fileName}</span>,
    skeleton: 'text',
  },
  {
    key: 'loaded',
    header: 'Filas cargadas',
    cell: (r) => formatCount(r.rowsLoaded),
    className: 'text-right tabular-nums',
    skeleton: 'text',
  },
  {
    key: 'skipped',
    header: 'Omitidas',
    cell: (r) => (r.rowsSkipped === null ? '—' : formatCount(r.rowsSkipped)),
    className: 'text-right tabular-nums',
    skeleton: 'text',
  },
  {
    key: 'status',
    header: 'Estado',
    cell: (r) => (
      <Badge tone={STATUS_TONE[r.status]} size="sm">
        {STATUS_LABEL[r.status]}
      </Badge>
    ),
    skeleton: 'badge',
  },
  { key: 'user', header: 'Quién', cell: (r) => r.userName, skeleton: 'text' },
];

export interface ImportHistoryProps {
  records: ImportRecord[];
  isLoading: boolean;
  error?: string;
}

/** "Cargas anteriores": every load, filterable by what it brought. */
export function ImportHistory({ records, isLoading, error }: ImportHistoryProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const count = (kind: Exclude<Filter, 'all'>) => records.filter((r) => r.kind === kind).length;
  const rows = useMemo(
    () => (filter === 'all' ? records : records.filter((r) => r.kind === filter)),
    [filter, records],
  );

  return (
    <section aria-labelledby="history-title" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="history-title" className="text-lg font-bold text-fg">
          Cargas anteriores{' '}
          <span className="text-sm font-normal text-muted">{records.length} cargas</span>
        </h2>
        <SegmentedControl
          legend="Filtrar cargas por tipo"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'Todas' },
            { value: 'inventory', label: `Inventario (${count('inventory')})` },
            { value: 'movements', label: `Movimientos (${count('movements')})` },
          ]}
        />
      </div>
      <DataTable
        caption="Cargas anteriores de inventario y movimientos"
        columns={COLUMNS}
        rows={rows}
        getRowKey={(r) => r.id}
        isLoading={isLoading}
        error={error}
        emptyMessage="No hay cargas de este tipo."
      />
    </section>
  );
}
