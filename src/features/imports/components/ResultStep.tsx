import { FiAlertTriangle, FiCheck, FiCheckCircle, FiCircle } from 'react-icons/fi';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/components/Button';
import { Spinner } from '@/shared/ui/components/Spinner';
import { useImportRun } from '../api/imports.queries';
import { formatCount } from '../lib/format';
import { PROCESSING_STEPS } from '../content/imports.labels';
import type { ImportKind, ImportPreview, ImportRun } from '../types/imports.types';

export interface ResultStepProps {
  kind: ImportKind;
  runId: string;
  preview: ImportPreview;
  onRetry: () => void;
  onBackToConfirm: () => void;
  onRestart: () => void;
  onOtherKind: () => void;
  onNavigate: (to: string) => void;
  onQuality: () => void;
}

function Processing({ kind, run }: { kind: ImportKind; run: ImportRun }) {
  const steps = PROCESSING_STEPS[kind];
  return (
    <div className="space-y-6 text-center">
      <Spinner className="mx-auto size-10 text-primary" />
      <div>
        <h2 className="text-xl font-bold text-fg">
          {kind === 'inventory'
            ? 'Estamos actualizando tu inventario'
            : 'Estamos cargando tu historial'}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Puedes salir de esta pantalla: la carga sigue y te avisamos cuando termine.
        </p>
      </div>
      <div className="mx-auto max-w-md">
        <div className="flex justify-between text-sm font-semibold text-fg">
          <span>{kind === 'inventory' ? 'Guardando existencias' : 'Guardando movimientos'}</span>
          <span>{run.progress} %</span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={run.progress}
          aria-label="Avance de la carga"
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-fg/10"
        >
          <div className="h-full bg-primary transition-all" style={{ width: `${run.progress}%` }} />
        </div>
      </div>
      <ul className="mx-auto max-w-md space-y-2 text-left text-sm">
        {steps.map((step) => {
          const done = run.doneSteps.includes(step.id);
          return (
            <li
              key={step.id}
              className={cn('flex items-center gap-2', done ? 'text-fg' : 'text-muted')}
            >
              {done ? <FiCheck aria-hidden className="text-success" /> : <FiCircle aria-hidden />}
              {step.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-line2 px-5 py-4 text-center">
      <p className="text-2xl font-bold text-fg">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

/** Step 5: progress while it runs, then the result (done, with skipped rows, or failed). */
export function ResultStep({
  kind,
  runId,
  preview,
  onRetry,
  onBackToConfirm,
  onRestart,
  onOtherKind,
  onNavigate,
  onQuality,
}: ResultStepProps) {
  const { data: run, isError } = useImportRun(runId);
  const inventory = kind === 'inventory';

  let body;
  if (isError || run?.state === 'FAILED') {
    body = (
      <div className="space-y-5 text-center">
        <FiAlertTriangle aria-hidden className="mx-auto size-12 text-danger" />
        <h2 className="text-xl font-bold text-fg">No pudimos completar la carga</h2>
        <p className="text-muted">
          Algo se interrumpió mientras{' '}
          {inventory ? 'actualizábamos las existencias' : 'cargábamos el historial'}.{' '}
          <strong className="text-fg">No se cambió nada</strong>
          {inventory ? ': tu inventario sigue como estaba.' : ': tu historial sigue como estaba.'}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={onRetry}>Intentar de nuevo</Button>
          <Button variant="outline" onClick={onBackToConfirm}>
            Volver al paso 4
          </Button>
        </div>
      </div>
    );
  } else if (!run || run.state === 'PROCESSING') {
    body = (
      <Processing
        kind={kind}
        run={run ?? { id: runId, state: 'PROCESSING', progress: 0, doneSteps: [], summary: null }}
      />
    );
  } else {
    const summary = run.summary;
    const skipped = summary?.rowsSkipped ?? 0;
    const partial = run.state === 'PARTIAL' && skipped > 0;
    body = (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          {partial ? (
            <FiAlertTriangle aria-hidden className="mx-auto size-12 text-warning" />
          ) : (
            <FiCheckCircle aria-hidden className="mx-auto size-12 text-success" />
          )}
          <h2 className="text-xl font-bold text-fg">
            {partial
              ? 'Actualizamos casi todo'
              : inventory
                ? 'Listo, tu inventario está al día'
                : 'Listo, tu historial está cargado'}
          </h2>
          {summary && (
            <p className="mx-auto max-w-xl text-muted">
              {inventory
                ? `Se cargaron ${formatCount(summary.rowsLoaded)} filas y se crearon ${formatCount(summary.adjustments)} ajustes.${
                    partial
                      ? ` Dejamos fuera ${skipped} filas con errores: esos productos conservan su existencia anterior.`
                      : ''
                  }`
                : `Se cargaron ${formatCount(summary.movements)} movimientos de ${summary.products} productos.${
                    partial ? ` Dejamos fuera ${skipped} filas con errores.` : ''
                  } Tus existencias de hoy no cambiaron.`}
            </p>
          )}
        </div>

        {summary && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              value={formatCount(summary.rowsLoaded)}
              label={partial ? 'cargadas' : 'filas cargadas'}
            />
            {partial && <Stat value={formatCount(skipped)} label="omitidas" />}
            {inventory && summary.pendingApproval > 0 && (
              <Stat value={String(summary.pendingApproval)} label="ajustes por aprobar" />
            )}
            {!partial && (
              <Stat
                value={formatCount(summary.products)}
                label={inventory ? 'productos' : 'productos con historial'}
              />
            )}
            {!partial && inventory && (
              <Stat value={String(summary.newProducts)} label="productos nuevos" />
            )}
          </div>
        )}

        {partial && preview.errorReasons.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-line2">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <caption className="sr-only">Por qué se omitieron filas y qué hacer</caption>
              <thead className="bg-fg/5 text-xs text-muted uppercase">
                <tr>
                  <th scope="col" className="px-4 py-2.5">
                    Motivo
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right">
                    Filas
                  </th>
                  <th scope="col" className="px-4 py-2.5">
                    Qué hacer
                  </th>
                </tr>
              </thead>
              <tbody>
                {preview.errorReasons.map((item) => (
                  <tr key={item.reason} className="border-t border-line2">
                    <td className="px-4 py-2.5 font-semibold text-fg">{item.reason}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{item.rows}</td>
                    <td className="px-4 py-2.5 text-muted">{item.fix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          {inventory ? (
            <>
              <Button onClick={() => onNavigate('/inventory')}>Ver existencias</Button>
              <Button variant="outline" onClick={() => onNavigate('/movements')}>
                {summary && summary.pendingApproval > 0
                  ? 'Revisar ajustes por aprobar'
                  : 'Ver los ajustes'}
              </Button>
              <Button variant="ghost" onClick={onOtherKind}>
                Ahora importar movimientos
              </Button>
            </>
          ) : (
            <>
              <Button onClick={onQuality}>Ver calidad del historial</Button>
              <Button variant="outline" onClick={() => onNavigate('/forecast')}>
                Ver pronósticos
              </Button>
            </>
          )}
          {partial && (
            <Button variant="ghost" onClick={onRestart}>
              Cargar archivo corregido
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <section aria-live="polite" className="rounded-3xl border border-line2 bg-surface p-6 sm:p-10">
      {body}
    </section>
  );
}
