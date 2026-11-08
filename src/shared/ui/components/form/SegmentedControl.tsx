import { useId } from 'react';
import type { IconType } from 'react-icons';
import { cn } from '@/shared/lib/cn';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: IconType;
}

export interface SegmentedControlProps<T extends string> {
  /** Accessible name of the group (visually hidden). */
  legend: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Two to four mutually exclusive views side by side ("Por almacén | Por producto"). Native radios
 * underneath: arrow keys move between segments, and screen readers announce a radio group.
 */
export function SegmentedControl<T extends string>({
  legend,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className="sr-only">{legend}</legend>
      <div className="inline-flex rounded-2xl border border-line2 bg-canvas p-1">
        {options.map(({ value: optionValue, label, icon: Icon }) => {
          const id = `${name}-${optionValue}`;
          return (
            <label key={optionValue} htmlFor={id} className="relative cursor-pointer">
              <input
                id={id}
                type="radio"
                name={name}
                value={optionValue}
                checked={value === optionValue}
                onChange={() => onChange(optionValue)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-muted transition',
                  'peer-checked:bg-surface peer-checked:text-fg peer-checked:shadow-sm hover:text-fg',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50',
                )}
              >
                {Icon && <Icon aria-hidden className="size-4" />}
                {label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
