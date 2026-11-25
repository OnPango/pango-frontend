import { useId } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { cn } from '@/shared/lib/cn';
import { METHOD_LABELS } from '../content/replenishment.labels';
import type { ReorderMethod } from '../types/inventory.types';

const METHODS: ReorderMethod[] = ['forecast', 'manual'];

interface ReplenishmentMethodSelectorProps {
  registerProps: UseFormRegisterReturn<'method'>;
  disabled?: boolean;
}

/**
 * Exclusive selector between system-calculated forecast values and manual values. Uses native
 * radios inside fixed-border choice cards so keyboard navigation works and selection never shifts
 * layout dimensions.
 */
export function ReplenishmentMethodSelector({
  registerProps,
  disabled = false,
}: ReplenishmentMethodSelectorProps) {
  const baseId = useId();

  return (
    <fieldset className="min-w-0" disabled={disabled}>
      <legend className="mb-2 text-xs font-semibold text-fg">¿Qué valores usar?</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {METHODS.map((option) => {
          const id = `${baseId}-${option}`;
          const copy = METHOD_LABELS[option];
          return (
            <label
              key={option}
              htmlFor={id}
              className={cn(
                'relative flex items-start gap-3 rounded-2xl border-2 border-line2 bg-surface p-3.5 transition-colors',
                'has-checked:border-primary has-checked:bg-primary/5',
                disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-fg/25',
              )}
            >
              <input
                id={id}
                type="radio"
                value={option}
                className="peer sr-only"
                {...registerProps}
              />
              <span
                aria-hidden
                className={cn(
                  'mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full border border-line2 bg-surface transition-colors',
                  'peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50',
                  'after:size-2 after:scale-0 after:rounded-full after:bg-primary after:transition-transform peer-checked:after:scale-100',
                )}
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-fg">{copy.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {copy.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
