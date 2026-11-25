import { useNavigate } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';
import { KIND_COPY } from '../../content/imports.labels';
import { useMovementImportWizard } from '../../hooks/useMovementImportWizard';
import { ImportStepper } from '../ImportStepper';
import { MovementConfirmStep } from './MovementConfirmStep';
import { MovementFileStep } from './MovementFileStep';
import { MovementMappingStep } from './MovementMappingStep';
import { MovementResultStep } from './MovementResultStep';
import { MovementReviewStep } from './MovementReviewStep';

export interface MovementImportWizardProps {
  onExit: () => void;
}

const STEP_NUMBER = { file: 1, columns: 2, preview: 3, confirm: 4, result: 5 } as const;

/**
 * The movement history import against pango-core (`/movement-imports`): the file is read here,
 * its rows are sent as JSON, validated, reviewed and confirmed.
 */
export function MovementImportWizard({ onExit }: MovementImportWizardProps) {
  const navigate = useNavigate();
  const wizard = useMovementImportWizard();
  const copy = KIND_COPY.movements;
  const { step, report, result } = wizard;

  return (
    <div className="space-y-6">
      <nav aria-label="Ruta" className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <button
          type="button"
          onClick={onExit}
          className="font-semibold text-primary hover:underline"
        >
          Importar datos
        </button>
        <FiChevronRight aria-hidden />
        <span className="font-semibold text-fg">Importar {copy.title.toLowerCase()}</span>
        <span className="hidden sm:inline">· {copy.tagline}</span>
      </nav>

      <ImportStepper current={STEP_NUMBER[step]} />

      {step === 'file' && <MovementFileStep wizard={wizard} onBack={onExit} />}

      {step === 'columns' && <MovementMappingStep wizard={wizard} />}

      {step === 'preview' && report && (
        <MovementReviewStep
          movementImport={report.import}
          onBack={() => wizard.goTo('columns')}
          onNext={() => wizard.goTo('confirm')}
        />
      )}

      {step === 'confirm' && report && (
        <MovementConfirmStep movementImport={report.import} wizard={wizard} />
      )}

      {step === 'result' && result && (
        <MovementResultStep
          result={result}
          onRestart={wizard.restart}
          onExit={onExit}
          onNavigate={(to) => void navigate(to)}
        />
      )}
    </div>
  );
}
