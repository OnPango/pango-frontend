import { useMemo } from 'react';
import { cn } from '@/shared/lib/cn';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { SegmentedControl } from '@/shared/ui/components/form/SegmentedControl';
import type { ImportPreview, Resolution } from '../types/imports.types';
import { StepFrame } from './StepFrame';

export interface ConflictsStepProps {
  preview: ImportPreview;
  resolutions: Record<string, Resolution>;
  onResolve: (ids: string[], value: Resolution) => void;
  onBack: () => void;
  onNext: () => void;
}

const CHOICES: { value: Resolution; label: string }[] = [
  { value: 'PANGO', label: 'Lo de Pango' },
  { value: 'FILE', label: 'Lo del archivo' },
];

/** Step 3b: for each datum that differs, keep what Pango has or take what the file brings. */
export function ConflictsStep({
  preview,
  resolutions,
  onResolve,
  onBack,
  onNext,
}: ConflictsStepProps) {
  const editable = useMemo(
    () => preview.conflicts.filter((item) => !item.locked).map((item) => item.id),
    [preview.conflicts],
  );
  const choice = (id: string): Resolution => resolutions[id] ?? 'PANGO';
  const hasLocked = preview.conflicts.some((item) => item.locked);

  return (
    <StepFrame title="3 · Elige qué datos guardar" onBack={onBack} onNext={onNext}>
      <p className="text-sm text-muted">
        Estos productos y bodegas ya existen en Pango, pero tu archivo trae algunos datos distintos.
        Para cada uno, elige si conservas lo que está en Pango o guardas lo del archivo.{' '}
        <strong className="text-fg">Si no eliges, se conserva lo de Pango.</strong> Las existencias
        se actualizan igual en los dos casos.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg">
          <strong>{preview.conflictRecords} registros</strong> con datos distintos ·{' '}
          {preview.conflictFields} datos en total
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">Para todos:</span>
          <Button size="sm" variant="outline" onClick={() => onResolve(editable, 'PANGO')}>
            Conservar lo de Pango
          </Button>
          <Button size="sm" variant="outline" onClick={() => onResolve(editable, 'FILE')}>
            Usar lo del archivo
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line2">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">Datos que son distintos entre Pango y tu archivo</caption>
          <thead className="bg-fg/5 text-xs text-muted uppercase">
            <tr>
              <th scope="col" className="px-4 py-2.5">
                Producto o bodega
              </th>
              <th scope="col" className="px-4 py-2.5">
                Dato
              </th>
              <th scope="col" className="px-4 py-2.5">
                En Pango
              </th>
              <th scope="col" className="px-4 py-2.5">
                En tu archivo
              </th>
              <th scope="col" className="px-4 py-2.5">
                Qué guardar
              </th>
            </tr>
          </thead>
          <tbody>
            {preview.conflicts.map((item) => (
              <tr key={item.id} className="border-t border-line2 align-middle">
                <th scope="row" className="px-4 py-3 font-semibold text-fg">
                  {item.name}
                  <span className="block text-xs font-normal text-muted">{item.code}</span>
                </th>
                <td className="px-4 py-3">{item.field}</td>
                <td className="px-4 py-3 text-muted">{item.inPango}</td>
                <td className={cn('px-4 py-3', !item.locked && 'font-semibold')}>{item.inFile}</td>
                <td className="px-4 py-3">
                  {item.locked ? (
                    <span className="text-xs text-muted">Se cambia desde el producto</span>
                  ) : (
                    <SegmentedControl
                      legend={`Qué guardar de ${item.field} de ${item.name}`}
                      options={CHOICES}
                      value={choice(item.id)}
                      onChange={(value) => onResolve([item.id], value)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasLocked && (
        <Alert tone="info">
          <strong>La unidad de medida no se cambia desde una carga</strong>, porque cambiaría el
          significado de las existencias y del historial. Si de verdad cambió, edítala en el
          producto.
        </Alert>
      )}
      <p className="text-sm text-muted">
        Se muestran {new Set(preview.conflicts.map((item) => item.code)).size} de{' '}
        {preview.conflictRecords} registros.
      </p>
    </StepFrame>
  );
}
