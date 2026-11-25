import { FiCheckCircle } from 'react-icons/fi';
import { Button } from '@/shared/ui/components/Button';
import { formatCount } from '../../lib/format';
import type { InventoryImport } from '../../types/inventoryImports.types';

export interface InventoryResultStepProps {
  result: InventoryImport;
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

/** Step 5: what the confirmation created. */
export function InventoryResultStep({
  result,
  onRestart,
  onExit,
  onNavigate,
}: InventoryResultStepProps) {
  const outcome = result.result;
  const created = outcome?.created ?? { products: 0, categories: 0, warehouses: 0, lots: 0 };

  return (
    <section aria-live="polite" className="rounded-3xl border border-line2 bg-surface p-6 sm:p-10">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <FiCheckCircle aria-hidden className="mx-auto size-12 text-success" />
          <h2 className="text-xl font-bold text-fg">Listo, tu inventario está cargado</h2>
          <p className="mx-auto max-w-xl text-muted">
            Se registraron las existencias de {formatCount(outcome?.stockRows ?? 0)} filas en{' '}
            {formatCount(outcome?.movements ?? 0)} movimientos de saldo inicial.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={created.products} label="productos nuevos" />
          <Stat value={created.categories} label="categorías nuevas" />
          <Stat value={created.warehouses} label="bodegas nuevas" />
          <Stat value={created.lots} label="lotes nuevos" />
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => onNavigate('/inventory')}>Ver inventario</Button>
          <Button variant="outline" onClick={onRestart}>
            Cargar otro archivo
          </Button>
          <Button variant="ghost" onClick={onExit}>
            Volver a Importar datos
          </Button>
        </div>
      </div>
    </section>
  );
}
