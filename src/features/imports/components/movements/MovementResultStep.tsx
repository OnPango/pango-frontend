import { FiCheckCircle } from 'react-icons/fi';
import { Button } from '@/shared/ui/components/Button';
import { formatCount } from '../../lib/format';
import type { MovementImport } from '../../types/movementImports.types';

export interface MovementResultStepProps {
  result: MovementImport;
  onRestart: () => void;
  onExit: () => void;
  onNavigate: (to: string) => void;
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-line2 px-5 py-4 text-center">
      <p className="text-2xl font-bold text-fg tabular-nums">{formatCount(value)}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

/** Step 5: what the confirmation saved. */
export function MovementResultStep({
  result,
  onRestart,
  onExit,
  onNavigate,
}: MovementResultStepProps) {
  const saved = result.savedCount ?? 0;
  const skipped = result.skippedCount ?? 0;
  const left = result.invalidRowCount;

  return (
    <section aria-live="polite" className="rounded-3xl border border-line2 bg-surface p-6 sm:p-10">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <FiCheckCircle aria-hidden className="mx-auto size-12 text-success" />
          <h2 className="text-xl font-bold text-fg">Listo, tu historial está cargado</h2>
          <p className="mx-auto max-w-xl text-muted">
            Se guardaron {formatCount(saved)} movimientos.
            {skipped > 0 &&
              ` ${formatCount(skipped)} ya los había guardado otra carga y se omitieron.`}
            {left > 0 && ` Quedaron fuera ${formatCount(left)} filas con errores.`} Tus existencias
            de hoy no cambiaron.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat value={saved} label="movimientos guardados" />
          <Stat value={skipped} label="ya estaban cargados" />
          <Stat value={left} label="filas con errores" />
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => onNavigate('/forecast')}>Ver pronósticos</Button>
          <Button variant="outline" onClick={onRestart}>
            {left > 0 ? 'Cargar archivo corregido' : 'Cargar otro archivo'}
          </Button>
          <Button variant="ghost" onClick={onExit}>
            Volver a Importar datos
          </Button>
        </div>
      </div>
    </section>
  );
}
