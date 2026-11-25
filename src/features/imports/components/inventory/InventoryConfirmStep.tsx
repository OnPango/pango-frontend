import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import { Spinner } from '@/shared/ui/components/Spinner';
import type { InventoryImportWizardState } from '../../hooks/useInventoryImportWizard';
import { formatCount } from '../../lib/format';
import type { InventoryImport } from '../../types/inventoryImports.types';
import { StepFrame } from '../StepFrame';

export interface InventoryConfirmStepProps {
  inventoryImport: InventoryImport;
  wizard: InventoryImportWizardState;
}

const plural = (n: number, one: string, many: string) =>
  `${formatCount(n)} ${n === 1 ? one : many}`;

/** Step 4: what is saved, and the one button that saves it. */
export function InventoryConfirmStep({ inventoryImport, wizard }: InventoryConfirmStepProps) {
  const summary = inventoryImport.summary;
  if (!summary) return null;
  const { create } = summary;
  const noCost = summary.issueCounts.COST_MISSING ?? 0;

  return (
    <StepFrame
      title="4 · Confirma la carga"
      onBack={() => wizard.goTo('preview')}
      onNext={wizard.confirm}
      nextLabel="Confirmar carga"
      nextLoading={wizard.isConfirming}
      nextDisabled={wizard.stale || wizard.isRevalidating}
      error={wizard.stepError}
    >
      <ul className="space-y-3 text-fg">
        <li>
          Se registrarán las existencias de{' '}
          <strong>{plural(summary.stockRows, 'fila', 'filas')}</strong> de{' '}
          <strong>{inventoryImport.fileName}</strong> como saldo inicial.
        </li>
        {(create.products > 0 || create.categories > 0) && (
          <li>
            Se crearán <strong>{plural(create.products, 'producto', 'productos')}</strong> y{' '}
            <strong>{plural(create.categories, 'categoría', 'categorías')}</strong>.
          </li>
        )}
        {(create.warehouses > 0 || create.lots > 0) && (
          <li>
            Se crearán <strong>{plural(create.warehouses, 'bodega', 'bodegas')}</strong> y{' '}
            <strong>{plural(create.lots, 'lote', 'lotes')}</strong>.
          </li>
        )}
        {noCost > 0 && (
          <li>
            <strong>{plural(noCost, 'fila', 'filas')}</strong> sin costo tomarán el costo promedio
            del producto.
          </li>
        )}
      </ul>

      {wizard.stale && (
        <Button onClick={wizard.revalidate} isLoading={wizard.isRevalidating}>
          Revisar de nuevo
        </Button>
      )}

      {wizard.isConfirming ? (
        <p role="status" className="flex items-center gap-3 rounded-2xl border border-line2 p-4">
          <Spinner className="size-5 shrink-0 text-primary" />
          Guardando tu inventario. Con muchas filas puede tardar hasta 2 minutos.
        </p>
      ) : (
        <Alert tone="warning">
          Es tu saldo de apertura: queda como movimiento «Saldo inicial» en cada bodega y no se
          puede deshacer. Para corregir un saldo después, usa un ajuste de inventario.
        </Alert>
      )}
    </StepFrame>
  );
}
