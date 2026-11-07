import { forwardRef, useEffect, useRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { FiCheck, FiMinus } from 'react-icons/fi';
import { cn } from '@/shared/lib/cn';
import { useFieldIds } from './useFieldIds';

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  label?: ReactNode;
  description?: string;
  error?: string;
  /** Partially selected (e.g. a "select all" over a partly selected list). */
  indeterminate?: boolean;
}

/** Native checkbox with the Pango look. Works controlled, uncontrolled and with `register()`. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, error, indeterminate = false, className, id: idProp, disabled, ...props },
  ref,
) {
  const { id, hintId, errorId, describedBy } = useFieldIds(idProp, description, error);
  const innerRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const setRefs = (node: HTMLInputElement | null) => {
    innerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={cn(
          'inline-flex items-center gap-2',
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        )}
      >
        <input
          ref={setRefs}
          id={id}
          type="checkbox"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden
          className={cn(
            'mt-px grid size-5 shrink-0 place-items-center rounded-md border bg-surface text-primary-fg transition-colors',
            error ? 'border-danger' : 'border-line2',
            'peer-checked:border-primary peer-checked:bg-primary peer-indeterminate:border-primary peer-indeterminate:bg-primary',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40',
            '[&>svg]:col-start-1 [&>svg]:row-start-1 [&>svg]:size-3.5 [&>svg]:scale-0 [&>svg]:transition-transform',
            'peer-checked:[&>.check]:scale-100 peer-indeterminate:[&>.check]:scale-0 peer-indeterminate:[&>.minus]:scale-100',
          )}
        >
          <FiCheck className="check" strokeWidth={3} />
          <FiMinus className="minus" strokeWidth={3} />
        </span>
        {(label || description) && (
          <span className="min-w-0">
            {label && <span className="block text-xs font-medium text-fg">{label}</span>}
            {description && !error && (
              <span id={hintId} className="block text-xs text-muted">
                {description}
              </span>
            )}
          </span>
        )}
      </label>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
