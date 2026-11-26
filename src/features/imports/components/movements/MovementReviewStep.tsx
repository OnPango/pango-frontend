import { useMemo, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import { DataTable } from '@/shared/ui/components/DataTable';
import { SegmentedControl } from '@/shared/ui/components/form/SegmentedControl';
import type { Column } from '@/shared/types/dataTable';
import {
  useMovementImportBalances,
  useMovementImportIssues,
} from '../../api/movementImports.queries';
import {
  COLUMN_LABEL,
  ISSUE_COPY,
  issueLabel,
  movementImportErrorMessage,
  severityOf,
} from '../../content/movementImports.labels';
import { formatCount } from '../../lib/format';
import type {
  ImportBalance,
  ImportIssue,
  IssueSeverity,
  MovementImport,
  TemplateColumn,
} from '../../types/movementImports.types';
import { StepFrame } from '../StepFrame';

export interface MovementReviewStepProps {
  movementImport: MovementImport;
  onBack: () => void;
  onNext: () => void;
}

const PAGE_SIZE = 25;

type View = 'issues' | 'balances';

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'danger' }) {
  return (
    <div className="rounded-2xl border border-line2 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p
        className={cn(
          'mt-1 text-2xl font-bold tabular-nums',
          tone === 'danger' && value > 0 ? 'text-danger' : 'text-fg',
        )}
      >
        {formatCount(value)}
      </p>
    </div>
  );
}

const ISSUE_COLUMNS: Column<ImportIssue>[] = [
  {
    key: 'row',
    header: 'Fila',
    cell: (r) => (r.rowNumber === null ? '—' : formatCount(r.rowNumber)),
    className: 'tabular-nums',
    skeleton: 'text',
  },
  {
    key: 'severity',
    header: 'Tipo',
    cell: (r) => (
      <Badge tone={r.severity === 'ERROR' ? 'danger' : 'warning'} size="sm">
        {r.severity === 'ERROR' ? 'Error' : 'Aviso'}
      </Badge>
    ),
    skeleton: 'badge',
  },
  {
    key: 'issue',
    header: 'Problema',
    cell: (r) => (
      <>
        <span className="font-semibold text-fg">{issueLabel(r.code, r.message)}</span>
        {r.field && (
          <span className="block text-xs text-muted">
            {COLUMN_LABEL[r.field as TemplateColumn] ?? r.field}
          </span>
        )}
      </>
    ),
    skeleton: 'title',
  },
  {
    key: 'value',
    header: 'Valor',
    cell: (r) => <span className="break-all">{r.value ?? '—'}</span>,
    skeleton: 'text',
  },
];

const number = (value: number | null) =>
  value === null ? '—' : value.toLocaleString('es-CO', { maximumFractionDigits: 4 });

const BALANCE_COLUMNS: Column<ImportBalance>[] = [
  {
    key: 'product',
    header: 'Producto',
    cell: (r) => (
      // Imported names can be long and have no spaces to break at: cap the column and cut them.
      <div className="max-w-56 min-w-0 sm:max-w-xs xl:max-w-sm" title={r.product.name}>
        <span className="block truncate font-semibold text-fg">{r.product.name}</span>
        <span className="block truncate text-xs text-muted">{r.product.sku}</span>
      </div>
    ),
    skeleton: 'title',
  },
  {
    key: 'warehouse',
    header: 'Bodega',
    cell: (r) => r.warehouse.name,
    skeleton: 'text',
  },
  {
    key: 'rows',
    header: 'Movimientos válidos',
    cell: (r) => formatCount(r.rows),
    className: 'text-right tabular-nums',
    skeleton: 'text',
  },
  {
    key: 'demand',
    header: 'Demanda',
    cell: (r) => `${number(r.demand)} ${r.product.unit}`,
    className: 'text-right tabular-nums',
    skeleton: 'text',
  },
  {
    key: 'closing',
    header: 'Saldo al final del archivo',
    cell: (r) =>
      r.closing === null ? 'Sin saldo de partida' : `${number(r.closing)} ${r.product.unit}`,
    className: 'text-right tabular-nums',
    skeleton: 'text',
  },
];

function IssuesView({ movementImport }: { movementImport: MovementImport }) {
  const counts = movementImport.issueCounts;
  const codes = useMemo(
    () =>
      Object.entries(counts)
        .filter(([, count]) => count > 0)
        .sort(
          ([a, ca], [b, cb]) =>
            (severityOf(a) === 'ERROR' ? 0 : 1) - (severityOf(b) === 'ERROR' ? 0 : 1) || cb - ca,
        ),
    [counts],
  );
  const [severity, setSeverity] = useState<IssueSeverity | 'ALL'>('ALL');
  const [code, setCode] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error } = useMovementImportIssues(
    movementImport.id,
    movementImport.revision,
    {
      page,
      pageSize: PAGE_SIZE,
      severity: severity === 'ALL' ? undefined : severity,
      code: code ?? undefined,
    },
  );

  if (codes.length === 0) {
    return <Alert tone="success">No encontramos ningún problema en las filas.</Alert>;
  }

  const filterBy = (next: string | null) => {
    setCode(next);
    setSeverity('ALL');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-line2">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <caption className="sr-only">Problemas encontrados, por motivo</caption>
          <thead className="bg-fg/5 text-xs text-muted uppercase">
            <tr>
              <th scope="col" className="px-4 py-2.5">
                Motivo
              </th>
              <th scope="col" className="px-4 py-2.5 text-right">
                Veces
              </th>
              <th scope="col" className="px-4 py-2.5">
                Qué hacer
              </th>
            </tr>
          </thead>
          <tbody>
            {codes.map(([issueCode, count]) => (
              <tr
                key={issueCode}
                className={cn('border-t border-line2', code === issueCode && 'bg-primary/5')}
              >
                <td className="px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => filterBy(code === issueCode ? null : issueCode)}
                    aria-pressed={code === issueCode}
                    className="flex items-center gap-2 text-left font-semibold text-fg hover:underline"
                  >
                    <Badge
                      tone={severityOf(issueCode) === 'ERROR' ? 'danger' : 'warning'}
                      size="sm"
                    >
                      {severityOf(issueCode) === 'ERROR' ? 'Error' : 'Aviso'}
                    </Badge>
                    {issueLabel(issueCode)}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatCount(count)}</td>
                <td className="px-4 py-2.5 text-muted">{ISSUE_COPY[issueCode]?.fix ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-fg">
          {code ? `Filas con «${issueLabel(code)}»` : 'Problemas por fila'}
        </h3>
        {code ? (
          <button
            type="button"
            onClick={() => filterBy(null)}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Ver todos los problemas
          </button>
        ) : (
          <SegmentedControl
            legend="Filtrar problemas por tipo"
            value={severity}
            onChange={(next) => {
              setSeverity(next);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'Todos' },
              { value: 'ERROR', label: 'Errores' },
              { value: 'WARNING', label: 'Avisos' },
            ]}
          />
        )}
      </div>

      <DataTable
        caption="Problemas encontrados en las filas de tu archivo"
        columns={ISSUE_COLUMNS}
        rows={data?.items ?? []}
        getRowKey={(r) => `${r.rowNumber}-${r.field}-${r.code}-${r.value}`}
        isLoading={isLoading}
        isRefreshing={isFetching && !isLoading}
        error={
          error ? movementImportErrorMessage(error, 'No pudimos cargar los problemas.') : undefined
        }
        emptyMessage="No hay problemas de este tipo."
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          totalItems: data?.total ?? 0,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}

function BalancesView({ movementImport }: { movementImport: MovementImport }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error } = useMovementImportBalances(
    movementImport.id,
    movementImport.revision,
    page,
    PAGE_SIZE,
  );
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Por producto y bodega, con las filas válidas: cuánto salió como venta o consumo (lo que usa
        el pronóstico) y el saldo que deja tu archivo al final.
      </p>
      <DataTable
        caption="Demanda y saldo por producto y bodega"
        columns={BALANCE_COLUMNS}
        rows={data?.items ?? []}
        getRowKey={(r) => `${r.product.id}-${r.warehouse.id}`}
        isLoading={isLoading}
        isRefreshing={isFetching && !isLoading}
        error={
          error ? movementImportErrorMessage(error, 'No pudimos cargar los saldos.') : undefined
        }
        emptyMessage="Ninguna fila válida todavía."
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          totalItems: data?.total ?? 0,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}

/** Step 3: what the validation found, before anything is saved. */
export function MovementReviewStep({ movementImport, onBack, onNext }: MovementReviewStepProps) {
  const [view, setView] = useState<View>('issues');
  const valid = movementImport.validRowCount;

  return (
    <StepFrame
      title="3 · Revisa cómo quedaría"
      onBack={onBack}
      onNext={onNext}
      nextDisabled={valid === 0}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Filas revisadas" value={movementImport.rowCount} />
        <Stat label="Filas válidas" value={valid} />
        <Stat label="Filas con errores" value={movementImport.invalidRowCount} tone="danger" />
        <Stat label="Repetidas o ya cargadas" value={movementImport.duplicateRowCount} />
      </div>

      {valid === 0 ? (
        <Alert tone="danger" title="Ninguna fila se puede cargar.">
          Corrige los problemas en tu archivo y vuelve a subirlo, o vuelve al paso 2 si alguna
          columna quedó mal unida.
        </Alert>
      ) : movementImport.invalidRowCount > 0 ? (
        <Alert tone="warning">
          Las filas con errores no se cargan. Puedes continuar con las válidas, o corregir tu
          archivo y volver a subirlo.
        </Alert>
      ) : null}

      <SegmentedControl
        legend="Qué ver"
        value={view}
        onChange={setView}
        options={[
          { value: 'issues', label: 'Problemas' },
          { value: 'balances', label: 'Por producto y bodega' },
        ]}
      />

      {view === 'issues' ? (
        <IssuesView key={movementImport.revision} movementImport={movementImport} />
      ) : (
        <BalancesView key={movementImport.revision} movementImport={movementImport} />
      )}
    </StepFrame>
  );
}
