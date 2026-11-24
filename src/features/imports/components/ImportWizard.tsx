import { useNavigate } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';
import { useImportWizard } from '../hooks/useImportWizard';
import { KIND_COPY } from '../content/imports.labels';
import type { ImportKind } from '../types/imports.types';
import { ConfirmStep } from './ConfirmStep';
import { ConflictsStep } from './ConflictsStep';
import { FileStep } from './FileStep';
import { ImportStepper } from './ImportStepper';
import { MappingStep } from './MappingStep';
import { ResultStep } from './ResultStep';
import { ReviewStep } from './ReviewStep';

export interface ImportWizardProps {
  kind: ImportKind;
  onExit: () => void;
  onOtherKind: () => void;
  onQuality: () => void;
}

const STEP_NUMBER = {
  file: 1,
  columns: 2,
  preview: 3,
  conflicts: 3,
  confirm: 4,
  result: 5,
} as const;

/** The five steps of one load, from choosing the file to its result. */
export function ImportWizard({ kind, onExit, onOtherKind, onQuality }: ImportWizardProps) {
  const navigate = useNavigate();
  const wizard = useImportWizard(kind);
  const copy = KIND_COPY[kind];
  const { step, analysis, preview } = wizard;
  const hasConflicts = (preview?.conflicts.length ?? 0) > 0;

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

      {step === 'file' && (
        <FileStep
          kind={kind}
          analysis={analysis}
          isReading={wizard.isReading}
          error={wizard.fileError}
          sheet={wizard.sheet}
          onSheet={wizard.setSheet}
          onFile={wizard.chooseFile}
          onClear={wizard.clearFile}
          onBack={onExit}
          onNext={() => wizard.setStep('columns')}
        />
      )}

      {step === 'columns' && analysis && (
        <MappingStep
          analysis={analysis}
          mapping={wizard.mapping}
          missing={wizard.missing}
          isLoading={wizard.isPreviewing}
          error={wizard.stepError}
          onColumn={wizard.setColumn}
          onBack={() => wizard.setStep('file')}
          onNext={wizard.goToPreview}
        />
      )}

      {step === 'preview' && preview && (
        <ReviewStep
          kind={kind}
          preview={preview}
          onBack={() => wizard.setStep('columns')}
          onNext={() => wizard.setStep(hasConflicts ? 'conflicts' : 'confirm')}
        />
      )}

      {step === 'conflicts' && preview && (
        <ConflictsStep
          preview={preview}
          resolutions={wizard.resolutions}
          onResolve={wizard.resolve}
          onBack={() => wizard.setStep('preview')}
          onNext={() => wizard.setStep('confirm')}
        />
      )}

      {step === 'confirm' && preview && (
        <ConfirmStep
          kind={kind}
          preview={preview}
          resolutions={wizard.resolutions}
          requireApproval={wizard.requireApproval}
          onRequireApproval={wizard.setRequireApproval}
          isStarting={wizard.isStarting}
          error={wizard.stepError}
          onChangeChoices={hasConflicts ? () => wizard.setStep('conflicts') : null}
          onBack={() => wizard.setStep(hasConflicts ? 'conflicts' : 'preview')}
          onConfirm={wizard.start}
        />
      )}

      {step === 'result' && wizard.runId && preview && (
        <ResultStep
          kind={kind}
          runId={wizard.runId}
          preview={preview}
          onRetry={wizard.start}
          onBackToConfirm={() => wizard.setStep('confirm')}
          onRestart={() => wizard.setStep('file')}
          onOtherKind={onOtherKind}
          onNavigate={(to) => void navigate(to)}
          onQuality={onQuality}
        />
      )}
    </div>
  );
}
