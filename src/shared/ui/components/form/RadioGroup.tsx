import { useId } from 'react';
import { cn } from '@/shared/lib/cn';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  legend: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  /** Shared `name` of the radios; generated when omitted. */
  name?: string;
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  error?: string;
  className?: string;
}

/** Single choice among a few visible options (use `Select` past ~5). */
export function RadioGroup({
  legend,
  options,
  value,
  onChange,
  name,
  orientation = 'vertical',
  disabled = false,
  error,
  className,
}: RadioGroupProps) {
  const generated = useId();
  const groupName = name ?? generated;

  return (
    <fieldset className={cn('min-w-0', className)} disabled={disabled}>
      <legend className="mb-1.5 text-xs font-semibold text-fg">{legend}</legend>
      <div className={cn('flex gap-3', orientation === 'vertical' ? 'flex-col' : 'flex-wrap')}>
        {options.map((option) => {
          const optionId = `${groupName}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cn(
                'relative inline-flex items-start gap-3',
                disabled || option.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
              )}
            >
              <input
                id={optionId}
                type="radio"
                name={groupName}
                value={option.value}
                checked={value === option.value}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  'mt-px grid size-5 shrink-0 place-items-center rounded-full border bg-surface transition-colors',
                  error ? 'border-danger' : 'border-line2',
                  'peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40',
                  'after:size-2.5 after:scale-0 after:rounded-full after:bg-primary after:transition-transform peer-checked:after:scale-100',
                )}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-fg">{option.label}</span>
                {option.description && (
                  <span className="block text-xs text-muted">{option.description}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
