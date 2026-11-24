import { FiCheck } from 'react-icons/fi';
import { cn } from '@/shared/lib/cn';
import { WIZARD_STEPS } from '../content/imports.labels';

export interface ImportStepperProps {
  /** 1 to 5. */
  current: number;
}

/** The five steps of a load: file, columns, preview, confirmation, result. */
export function ImportStepper({ current }: ImportStepperProps) {
  return (
    <ol aria-label="Pasos de la carga" className="flex flex-wrap items-center gap-x-2 gap-y-2">
      {WIZARD_STEPS.map((label, index) => {
        const number = index + 1;
        const done = number < current;
        const active = number === current;
        return (
          <li
            key={label}
            aria-current={active ? 'step' : undefined}
            className="flex items-center gap-2"
          >
            <span
              className={cn(
                'grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold',
                done && 'border-success bg-success text-canvas',
                active && 'border-primary bg-primary text-primary-fg',
                !done && !active && 'border-line2 text-muted',
              )}
            >
              {done ? <FiCheck aria-hidden /> : number}
            </span>
            <span
              className={cn(
                'text-sm font-semibold',
                active ? 'text-fg' : 'text-muted',
                !active && 'hidden sm:inline',
              )}
            >
              {label}
              {done && <span className="sr-only"> (completado)</span>}
            </span>
            {number < WIZARD_STEPS.length && (
              <span aria-hidden className="mx-1 hidden h-px w-6 bg-line2 sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
