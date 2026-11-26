import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import { Button } from '@/shared/ui/components/Button';
import { DataTable } from '@/shared/ui/components/DataTable';
import type { Column } from '@/shared/types/dataTable';
import { useQuality } from '../api/imports.queries';
import { importsErrorMessage } from '../content/imports.errors';
import { QUALITY_EFFECT, QUALITY_LABEL, QUALITY_TONE } from '../content/imports.labels';
import type { QualityRow } from '../types/imports.types';

const COLUMNS: Column<QualityRow>[] = [
  {
    key: 'product',
    header: 'Producto',
    cell: (r) => (
      // Imported names can be long and have no spaces to break at: cap the column and cut them.
      <div className="max-w-56 min-w-0 sm:max-w-xs xl:max-w-sm" title={r.name}>
        <span className="block truncate font-semibold text-fg">{r.name}</span>
        <span className="block truncate text-xs text-muted">{r.code}</span>
      </div>
    ),
    skeleton: 'title',
  },
  {
    key: 'months',
    header: 'Meses con datos',
    cell: (r) => `${r.monthsWithData} de 12`,
    skeleton: 'text',
  },
  {
    key: 'gaps',
    header: 'Huecos',
    cell: (r) => r.gaps,
    className: 'tabular-nums',
    skeleton: 'text',
  },
  {
    key: 'quality',
    header: 'Calidad',
    cell: (r) => (
      <Badge tone={QUALITY_TONE[r.quality]} size="sm">
        {QUALITY_LABEL[r.quality]}
      </Badge>
    ),
    skeleton: 'badge',
  },
  {
    key: 'effect',
    header: 'Efecto en el pronóstico',
    cell: (r) => QUALITY_EFFECT[r.quality],
    skeleton: 'text',
  },
];

export interface QualityViewProps {
  onNewLoad: () => void;
}

/** "Calidad del historial": how reliable each product's forecast can be. */
export function QualityView({ onNewLoad }: QualityViewProps) {
  const { data, isLoading, error } = useQuality();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-xl text-sm text-muted">
          Cuántos datos tiene Pango de cada producto y qué tan confiable será su pronóstico.
        </p>
        <Button onClick={onNewLoad}>Nueva carga</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ['Con buena calidad', data?.good, 'text-success'],
            ['Con calidad regular', data?.regular, 'text-warning'],
            ['Con calidad baja', data?.low, 'text-danger'],
          ] as const
        ).map(([label, value, tone]) => (
          <div key={label} className="rounded-2xl border border-line2 bg-surface p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className={`mt-1 text-3xl font-bold ${tone}`}>{value ?? '—'}</p>
          </div>
        ))}
      </div>

      <section aria-labelledby="quality-title" className="space-y-3">
        <h2 id="quality-title" className="text-lg font-bold text-fg">
          Por producto
        </h2>
        <Alert tone="info">
          La calidad cuenta cuántos meses tienen movimientos y cuántos huecos hay. Más meses y menos
          huecos dan pronósticos más confiables.
        </Alert>
        <DataTable
          caption="Calidad del historial de cada producto"
          columns={COLUMNS}
          rows={data?.rows ?? []}
          getRowKey={(r) => r.productId}
          isLoading={isLoading}
          error={
            error
              ? importsErrorMessage(error, 'No pudimos cargar la calidad del historial.')
              : undefined
          }
          emptyMessage="Todavía no hay historial de movimientos."
        />
        <p className="text-sm text-muted">
          Para mejorar un producto con calidad baja, sube más historial o registra sus movimientos
          con regularidad.
        </p>
      </section>
    </div>
  );
}
