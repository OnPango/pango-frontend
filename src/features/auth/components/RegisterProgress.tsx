import { cn } from '@/shared/lib/cn';

interface RegisterProgressProps {
  step: 'account' | 'company';
}

const STEP_NAMES = { account: 'Tu cuenta', company: 'Tu empresa' } as const;

function Bar({ filled }: { filled: boolean }) {
  return (
    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line2">
      <span
        className={cn(
          'block h-full origin-left rounded-full bg-primary transition-transform duration-700 ease-out',
          filled ? 'scale-x-100' : 'scale-x-0',
        )}
      />
    </span>
  );
}

/** Two-segment progress bar; the second segment fills when the person reaches the company step. */
export function RegisterProgress({ step }: RegisterProgressProps) {
  const current = step === 'account' ? 1 : 2;

  return (
    <div role="group" aria-label="Progreso del registro" className="space-y-2">
      <div aria-hidden className="flex gap-2">
        <Bar filled />
        <Bar filled={current === 2} />
      </div>
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-primary">Paso {current} de 2</span>
        <span className="text-muted">{STEP_NAMES[step]}</span>
      </div>
    </div>
  );
}
