import type { ReactNode } from 'react';
import { Alert } from '@/shared/ui/components/Alert';
import { Button } from '@/shared/ui/components/Button';

export interface StepFrameProps {
  title: string;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  /** Message of the last failed call of this step. */
  error?: string | null;
  /** Replaces the default footer (steps with their own actions). */
  footer?: ReactNode;
}

/** The card every step of the load sits in: title, content and the Atrás / Continuar footer. */
export function StepFrame({
  title,
  children,
  onBack,
  onNext,
  nextLabel = 'Continuar',
  nextDisabled,
  nextLoading,
  error,
  footer,
}: StepFrameProps) {
  return (
    <section
      aria-labelledby="step-title"
      className="rounded-3xl border border-line2 bg-surface p-5 sm:p-8"
    >
      <h2 id="step-title" className="text-lg font-bold text-fg">
        {title}
      </h2>
      <div className="mt-5 space-y-5">
        {children}
        {error && <Alert tone="danger">{error}</Alert>}
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line2 pt-5">
        {footer ?? (
          <>
            <Button variant="outline" onClick={onBack} disabled={!onBack}>
              Atrás
            </Button>
            <Button onClick={onNext} disabled={nextDisabled} isLoading={nextLoading}>
              {nextLabel}
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
