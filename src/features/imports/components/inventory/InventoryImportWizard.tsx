import { useNavigate } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';
import { Button } from '@/shared/ui/components/Button';
import { KIND_COPY } from '../../content/imports.labels';
import { hasInventoryImportInProgress } from '../../hooks/inventoryImport.store';
import { useInventoryImportWizard } from '../../hooks/useInventoryImportWizard';
import { ImportStepper } from '../ImportStepper';
import { InventoryConfirmStep } from './InventoryConfirmStep';
import { InventoryFileStep } from './InventoryFileStep';
import { InventoryMappingStep } from './InventoryMappingStep';
import { InventoryResultStep } from './InventoryResultStep';
import { InventoryReviewStep } from './InventoryReviewStep';

export interface InventoryImportWizardProps {
  onExit: () => void;
}

const STEP_NUMBER = { file: 1, columns: 2, preview: 3, confirm: 4, result: 5 } as const;

/**
 * The inventory import against pango-core (`/inventory-imports`): the workbook is read here, its
 * rows are sent as text in batches, validated, previewed and confirmed.
 */
export function InventoryImportWizard({ onExit }: InventoryImportWizardProps) {
  const navigate = useNavigate();
  const wizard = useInventoryImportWizard();
  const copy = KIND_COPY.inventory;
  const { step, report, result } = wizard;
  // Leaving on purpose ends the import (cancelled in Pango if still open). Going to another page
  // keeps it.
  const inProgress = hasInventoryImportInProgress(wizard);
  const exit = () => {
    wizard.restart();
    onExit();
  };

  return (
    <div className="space-y-6">
      <nav aria-label="Ruta" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        {inProgress ? (
          <span className="font-semibold">Importar datos</span>
        ) : (
          <button
            type="button"
            onClick={exit}
            className="font-semibold text-primary hover:underline"
          >
            Importar datos
          </button>
        )}
        <FiChevronRight aria-hidden />
        <span className="font-semibold text-fg">Importar {copy.title.toLowerCase()}</span>
        <span className="hidden sm:inline">· {copy.tagline}</span>
        {inProgress && (
          <Button variant="ghost" size="sm" onClick={exit} className="ml-auto">
            Cancelar carga
          </Button>
        )}
      </nav>

      <ImportStepper current={STEP_NUMBER[step]} />

      {step === 'file' && <InventoryFileStep wizard={wizard} onBack={exit} />}

      {step === 'columns' && <InventoryMappingStep wizard={wizard} />}

      {step === 'preview' && report && (
        <InventoryReviewStep
          inventoryImport={report.import}
          onBack={() => wizard.goTo('columns')}
          onNext={() => wizard.goTo('confirm')}
          onRestart={wizard.restart}
        />
      )}

      {step === 'confirm' && report && (
        <InventoryConfirmStep inventoryImport={report.import} wizard={wizard} />
      )}

      {step === 'result' && result && (
        <InventoryResultStep
          result={result}
          onRestart={wizard.restart}
          onExit={exit}
          onNavigate={(to) => {
            wizard.restart();
            void navigate(to);
          }}
        />
      )}
    </div>
  );
}
