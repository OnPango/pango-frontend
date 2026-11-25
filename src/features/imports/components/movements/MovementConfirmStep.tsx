import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';
import type { MovementImportWizardState } from '../../hooks/useMovementImportWizard';
import { formatCount } from '../../lib/format';
import type { MovementImport } from '../../types/movementImports.types';
import { StepFrame } from '../StepFrame';

export interface MovementConfirmStepProps {
  movementImport: MovementImport;
  wizard: MovementImportWizardState;
}

/** Step 4: the summary of what is saved, and the one button that saves it. */
export function MovementConfirmStep({ movementImport, wizard }: MovementConfirmStepProps) {
  const left = movementImport.invalidRowCount;
  const repeated = movementImport.duplicateRowCount;

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
          Se guardarán <strong>{formatCount(movementImport.validRowCount)} movimientos</strong> de{' '}
          <strong>{movementImport.fileName ?? 'tu archivo'}</strong> en tu historial.
        </li>
        <li>
          Sistema de origen: <strong>{movementImport.sourceNamespace}</strong>.
        </li>
        {left > 0 && (
          <li>
            Se dejarán fuera <strong>{formatCount(left)} filas</strong> con errores.
          </li>
        )}
        {repeated > 0 && (
          <li>
            <strong>{formatCount(repeated)} filas</strong> estaban repetidas o ya se habían cargado:
            se cuentan una sola vez.
          </li>
        )}
      </ul>

      {wizard.stale && (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={wizard.revalidate} isLoading={wizard.isRevalidating}>
            Revisar de nuevo
          </Button>
        </div>
      )}

      <Alert tone="warning">
        Esta carga se suma a tu historial y no cambia tus existencias, costos ni alertas de hoy.
        Solo cuenta hasta el primer movimiento que registraste en Pango para cada producto y bodega.
        No se puede deshacer.
      </Alert>
    </StepFrame>
  );
}
