import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { useFieldIds } from './useFieldIds';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: ReactNode;
  description?: string;
  /** Label on the left and the switch on the right (settings rows). */
  labelFirst?: boolean;
}

/** On/off toggle for settings that apply immediately. Use `Checkbox` for options sent with a form. */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, description, labelFirst = false, className, id: idProp, disabled, ...props },
  ref,
) {
  const { id, hintId, describedBy } = useFieldIds(idProp, description);

  const track = (
    <span
      aria-hidden
      className={cn(
        'relative inline-block h-6 w-11 shrink-0 rounded-full border border-line2 bg-fg/15 transition-colors',
        'peer-checked:border-primary peer-checked:bg-primary',
        'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40',
        'after:absolute after:top-0.5 after:left-0.5 after:size-4.5 after:rounded-full after:bg-surface after:shadow-sm after:transition-transform',
        'peer-checked:after:translate-x-5 motion-reduce:after:transition-none',
      )}
    />
  );

  const text = (label || description) && (
    <span className="min-w-0">
      {label && <span className="block text-sm font-medium text-fg">{label}</span>}
      {description && (
        <span id={hintId} className="block text-xs text-muted">
          {description}
        </span>
      )}
    </span>
  );

  return (
    <label
      htmlFor={id}
      className={cn(
        // `relative`: the visually hidden input is absolute and must not escape to a scroll-locked ancestor.
        'relative flex items-center gap-3',
        labelFirst && 'justify-between',
        disabled ? 'cursor-not-allowed opacity-60' : '',
        className,
      )}
    >
      <input
        ref={ref}
        id={id}
        type="checkbox"
        role="switch"
        disabled={disabled}
        aria-describedby={describedBy}
        className="peer sr-only"
        {...props}
      />
      {labelFirst ? (
        <>
          {text}
          {track}
        </>
      ) : (
        <>
          {track}
          {text}
        </>
      )}
    </label>
  );
});
