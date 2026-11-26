import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Alert } from '@/shared/ui/components/Alert';
import { Badge } from '@/shared/ui/components/Badge';
import { RESULT_LABEL } from '../content/imports.labels';
import type { ImportKind, ImportPreview, PreviewRow, RowResult } from '../types/imports.types';
import { formatCount } from '../lib/format';
import { StepFrame } from './StepFrame';

export interface ReviewStepProps {
  kind: ImportKind;
  preview: ImportPreview;
  onBack: () => void;
  onNext: () => void;
}

type Tab = 'all' | 'changed' | 'new' | 'errors';

const RESULT_TONE: Record<RowResult, 'success' | 'neutral' | 'primary' | 'danger'> = {
  VALID: 'success',
  NO_CHANGE: 'neutral',
  NEW: 'primary',
  ERROR: 'danger',
};

const matches = (row: PreviewRow, tab: Tab) =>
  tab === 'all' ||
  (tab === 'errors' && row.result === 'ERROR') ||
  (tab === 'new' && row.result === 'NEW') ||
  (tab === 'changed' && (row.result === 'VALID' || row.result === 'NEW'));

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'danger' }) {
  return (
    <div className="rounded-2xl border border-line2 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn('mt-1 text-2xl font-bold', tone === 'danger' ? 'text-danger' : 'text-fg')}>
        {value}
      </p>
    </div>
  );
}

/** Step 3: what the load would do, row by row, before anything is saved. */
export function ReviewStep({ kind, preview, onBack, onNext }: ReviewStepProps) {
  const [tab, setTab] = useState<Tab>('all');
  const inventory = kind === 'inventory';
  const rows = preview.rows.filter((row) => matches(row, tab));
  const c = preview.creations;

  const tabs: { id: Tab; label: string }[] = inventory
    ? [
        { id: 'all', label: 'Todas' },
        { id: 'changed', label: `Con diferencia (${formatCount(preview.stockChanges ?? 0)})` },
        { id: 'new', label: `Nuevos (${formatCount(c?.products ?? 0)})` },
        { id: 'errors', label: `Con errores (${formatCount(preview.errorRows)})` },
      ]
    : [
        { id: 'all', label: 'Todas' },
        { id: 'changed', label: 'Válidas' },
        { id: 'errors', label: `Con errores (${formatCount(preview.errorRows)})` },
      ];

  return (
    <StepFrame
      title="3 · Revisa cómo quedaría"
      onBack={onBack}
      onNext={onNext}
      nextLabel={inventory && preview.conflicts.length > 0 ? 'Continuar' : 'Continuar'}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Filas válidas" value={formatCount(preview.validRows)} />
        <Stat label="Filas con errores" value={formatCount(preview.errorRows)} tone="danger" />
        {inventory ? (
          <>
            <Stat label="Existencias que cambian" value={formatCount(preview.stockChanges ?? 0)} />
            <Stat label="Productos nuevos" value={formatCount(c?.products ?? 0)} />
          </>
        ) : (
          <>
            <Stat label="Productos" value={formatCount(preview.products ?? 0)} />
            <Stat label="Periodo" value={preview.period ?? '—'} />
          </>
        )}
      </div>

      {inventory && c && (
        <Alert tone="info">
          Además de actualizar existencias, se crearán {c.products} productos, {c.categories}{' '}
          categorías, {c.warehouses} bodega y {c.lots} lotes que todavía no están en Pango.
        </Alert>
      )}
      {inventory && preview.conflictRecords > 0 && (
        <Alert tone="warning">
          {preview.conflictRecords} productos y bodegas que ya existen traen datos distintos
          (nombre, categoría, costo…). En el siguiente paso eliges qué guardar.
        </Alert>
      )}

      <div role="tablist" aria-label="Filtrar filas" className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-semibold transition',
              tab === item.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-line2 text-muted hover:bg-fg/5',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line2">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">Vista previa de las filas de tu archivo</caption>
          <thead className="bg-fg/5 text-xs text-muted uppercase">
            <tr>
              {preview.columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn('px-4 py-2.5', column.numeric && 'text-right')}
                >
                  {column.label}
                </th>
              ))}
              <th scope="col" className="px-4 py-2.5">
                Resultado
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={preview.columns.length + 1}
                  className="px-4 py-6 text-center text-muted"
                >
                  No hay filas de este tipo en la muestra.
                </td>
              </tr>
            )}
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-line2">
                {row.cells.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn(
                      'px-4 py-2.5',
                      preview.columns[cellIndex]?.numeric && 'text-right tabular-nums',
                    )}
                  >
                    {cell}
                  </td>
                ))}
                <td className="px-4 py-2.5">
                  <Badge tone={RESULT_TONE[row.result]} size="sm">
                    {row.note || RESULT_LABEL[row.result]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted">
        Se muestran las primeras {preview.shownRows} de {formatCount(preview.totalRows)} filas.{' '}
        {inventory
          ? 'Cada diferencia se registra como un ajuste de inventario con la fecha y hora de la carga. Los productos que no estén en el archivo conservan su existencia. '
          : ''}
        Las filas con errores no se cargan: descárgalas, corrígelas y súbelas de nuevo.
      </p>
    </StepFrame>
  );
}
