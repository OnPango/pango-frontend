import { useId, useMemo, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { DataTable } from '@/shared/ui/components/DataTable';
import { SegmentedControl } from '@/shared/ui/components/form/SegmentedControl';
import type { Column } from '@/shared/types/dataTable';
import {
  useInventoryImportIssues,
  useInventoryImportRows,
} from '../../api/inventoryImports.queries';
import {
  fieldLabel,
  INVENTORY_ISSUE_COPY,
  inventoryImportErrorMessage,
  inventoryIssueLabel,
  isWarningCode,
} from '../../content/inventoryImports.labels';
import { formatCount } from '../../lib/format';
import type {
  InventoryImport,
  InventoryImportIssue,
  InventoryPreviewRow,
  IssueSeverity,
  PreviewEntity,
  PreviewRowsQuery,
} from '../../types/inventoryImports.types';
import { StepFrame } from '../StepFrame';

export interface InventoryReviewStepProps {
  inventoryImport: InventoryImport;
  onBack: () => void;
  onNext: () => void;
  /** Starts over with a corrected file (the current import is cancelled). */
  onRestart: () => void;
}

const PAGE_SIZE = 25;

type View = 'issues' | 'rows';

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

const ISSUE_COLUMNS: Column<InventoryImportIssue>[] = [
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
        <span className="font-semibold text-fg">{inventoryIssueLabel(r.code, r.message)}</span>
        {r.field && (
          <span className="block text-xs text-muted">
            {r.sourceColumn?.header ?? fieldLabel(r.field)}
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

const ROW_STATUS: Record<
  InventoryPreviewRow['status'],
  { label: string; tone: 'success' | 'danger' | 'neutral' }
> = {
  VALID: { label: 'Válida', tone: 'success' },
  INVALID: { label: 'Con errores', tone: 'danger' },
  DUPLICATE: { label: 'Repetida', tone: 'neutral' },
  PENDING: { label: 'Sin revisar', tone: 'neutral' },
};

/** A name with "Nueva" beside it when the confirmation would create it. */
function Entity({ entity, sub }: { entity: PreviewEntity | null; sub?: string | null }) {
  if (!entity) return <>—</>;
  return (
    <>
      <span className="font-semibold text-fg">{entity.name ?? '—'}</span>
      {entity.isNew && (
        <Badge tone="primary" size="sm" className="ml-2">
          Nueva
        </Badge>
      )}
      {sub && <span className="block text-xs text-muted">{sub}</span>}
    </>
  );
}

/** Exact digits from the API, with Colombian separators for reading. */
const decimal = (value: string | null) =>
  value === null ? '—' : Number(value).toLocaleString('es-CO', { maximumFractionDigits: 4 });

const ROW_COLUMNS: Column<InventoryPreviewRow>[] = [
  {
    key: 'row',
    header: 'Fila',
    cell: (r) => formatCount(r.rowNumber),
    className: 'tabular-nums',
    skeleton: 'text',
  },
  {
    key: 'status',
    header: 'Estado',
    cell: (r) => (
      <Badge tone={ROW_STATUS[r.status].tone} size="sm">
        {ROW_STATUS[r.status].label}
      </Badge>
    ),
    skeleton: 'badge',
  },
  {
    key: 'product',
    header: 'Producto',
    cell: (r) => <Entity entity={r.product} sub={r.sku} />,
    skeleton: 'title',
  },
  {
    key: 'category',
    header: 'Categoría',
    cell: (r) => <Entity entity={r.category} />,
    skeleton: 'text',
  },
  {
    key: 'warehouse',
    header: 'Bodega',
    cell: (r) => (
      <Entity
        entity={r.warehouse}
        sub={r.lot ? `Lote ${r.lot.code}${r.lot.isNew ? ' (nuevo)' : ''}` : r.locationCode}
      />
    ),
    skeleton: 'title',
  },
  {
    key: 'quantity',
    header: 'Saldo',
    cell: (r) => `${decimal(r.quantity)}${r.stockUnit ? ` ${r.stockUnit}` : ''}`,
    className: 'text-right tabular-nums',
    skeleton: 'text',
  },
  {
    key: 'cost',
    header: 'Costo unitario',
    cell: (r) => decimal(r.unitCost),
    className: 'text-right tabular-nums',
    skeleton: 'text',
  },
];

function IssuesView({ inventoryImport }: { inventoryImport: InventoryImport }) {
  const captionId = useId();
  const counts = inventoryImport.summary?.issueCounts;
  const codes = useMemo(
    () =>
      Object.entries(counts ?? {})
        .filter(([, count]) => count > 0)
        .sort(([a, ca], [b, cb]) => Number(isWarningCode(a)) - Number(isWarningCode(b)) || cb - ca),
    [counts],
  );
  const [severity, setSeverity] = useState<IssueSeverity | 'ALL'>('ALL');
  const [code, setCode] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error } = useInventoryImportIssues(
    inventoryImport.id,
    inventoryImport.revision,
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
      <div
        role="region"
        aria-labelledby={captionId}
        className="overflow-x-auto rounded-2xl border border-line2"
      >
        <table className="w-full min-w-[36rem] text-left text-sm">
          <caption id={captionId} className="sr-only">
            Problemas encontrados, por motivo
          </caption>
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
            {codes.map(([issueCode, count]) => {
              const warning = isWarningCode(issueCode);
              return (
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
                      <Badge tone={warning ? 'warning' : 'danger'} size="sm">
                        {warning ? 'Aviso' : 'Error'}
                      </Badge>
                      {inventoryIssueLabel(issueCode)}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatCount(count)}</td>
                  <td className="px-4 py-2.5 text-muted">
                    {INVENTORY_ISSUE_COPY[issueCode]?.fix ?? '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-fg">
          {code ? `Filas con «${inventoryIssueLabel(code)}»` : 'Problemas por fila'}
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
          error ? inventoryImportErrorMessage(error, 'No pudimos cargar los problemas.') : undefined
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

type RowFilter = NonNullable<PreviewRowsQuery['status']> | 'ALL';

function RowsView({ inventoryImport }: { inventoryImport: InventoryImport }) {
  const [status, setStatus] = useState<RowFilter>('ALL');
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error } = useInventoryImportRows(
    inventoryImport.id,
    inventoryImport.revision,
    { page, pageSize: PAGE_SIZE, status: status === 'ALL' ? undefined : status },
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Cada fila de tu archivo y a qué queda unida en Pango. «Nueva» es lo que se creará al
          confirmar.
        </p>
        <SegmentedControl
          legend="Filtrar filas por estado"
          value={status}
          onChange={(next) => {
            setStatus(next);
            setPage(1);
          }}
          options={[
            { value: 'ALL', label: 'Todas' },
            { value: 'VALID', label: 'Válidas' },
            { value: 'INVALID', label: 'Con errores' },
            { value: 'DUPLICATE', label: 'Repetidas' },
          ]}
        />
      </div>
      <DataTable
        caption="Vista previa de las filas de tu archivo"
        columns={ROW_COLUMNS}
        rows={data?.items ?? []}
        getRowKey={(r) => String(r.rowNumber)}
        isLoading={isLoading}
        isRefreshing={isFetching && !isLoading}
        error={
          error ? inventoryImportErrorMessage(error, 'No pudimos cargar las filas.') : undefined
        }
        emptyMessage="No hay filas con este estado."
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

/** "12 productos, 3 categorías": only the kinds with something, in that order. */
function entityList(counts: {
  products: number;
  categories: number;
  warehouses: number;
  lots: number;
}) {
  const parts: [number, string, string][] = [
    [counts.products, 'producto', 'productos'],
    [counts.categories, 'categoría', 'categorías'],
    [counts.warehouses, 'bodega', 'bodegas'],
    [counts.lots, 'lote', 'lotes'],
  ];
  return parts
    .filter(([n]) => n > 0)
    .map(([n, one, many]) => `${formatCount(n)} ${n === 1 ? one : many}`)
    .join(', ');
}

/** Step 3: what the validation found and what would be created, before anything is saved. */
export function InventoryReviewStep({
  inventoryImport,
  onBack,
  onNext,
  onRestart,
}: InventoryReviewStepProps) {
  const [view, setView] = useState<View>('issues');
  const summary = inventoryImport.summary;
  if (!summary) return null;
  const invalid = inventoryImport.status === 'INVALID';
  const created = entityList(summary.create);
  const reused = entityList(summary.reuse);

  return (
    <StepFrame
      title="3 · Revisa cómo quedaría"
      onBack={onBack}
      onNext={onNext}
      nextDisabled={invalid}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Filas revisadas" value={summary.totalRows} />
        <Stat label="Filas con saldo" value={summary.stockRows} />
        <Stat label="Filas con errores" value={summary.invalidRows} tone="danger" />
        <Stat label="Filas repetidas" value={summary.duplicateRows} />
      </div>

      <ul className="space-y-1 text-sm text-fg">
        <li>
          Se crearán: <strong>{created || 'nada nuevo'}</strong>.
        </li>
        {reused && (
          <li>
            Ya existen en Pango y se usarán: <strong>{reused}</strong>.
          </li>
        )}
      </ul>

      {invalid ? (
        <Alert tone="danger" title={`Hay ${formatCount(summary.invalidRows)} filas con errores.`}>
          <p>
            Para que el inventario quede completo, la carga se guarda entera o no se guarda. Corrige
            esas filas en tu archivo y vuélvelo a subir. Si una columna quedó mal unida, vuelve al
            paso 2.
          </p>
          <Button size="sm" variant="outline" className="mt-3" onClick={onRestart}>
            Subir archivo corregido
          </Button>
        </Alert>
      ) : summary.warnings > 0 ? (
        <Alert tone="warning">
          Hay {formatCount(summary.warnings)} avisos. No impiden cargar: revisa si estás de acuerdo
          y continúa.
        </Alert>
      ) : null}

      <SegmentedControl
        legend="Qué ver"
        value={view}
        onChange={setView}
        options={[
          { value: 'issues', label: 'Problemas' },
          { value: 'rows', label: 'Filas' },
        ]}
      />

      {view === 'issues' ? (
        <IssuesView key={inventoryImport.revision} inventoryImport={inventoryImport} />
      ) : (
        <RowsView key={inventoryImport.revision} inventoryImport={inventoryImport} />
      )}
    </StepFrame>
  );
}
