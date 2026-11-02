import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'required'> {
  label: string;
  /** Validation message. When set the field is flagged invalid and the message is announced. */
  error?: string;
  hint?: string;
  /** Marks the label with an asterisk. Validation is the form's job: the native `required` is not used. */
  required?: boolean;
}

/**
 * Labelled text input with hint and error. Forwards its ref, so it works with
 * React Hook Form's `register`: `<TextField label="Correo" {...register('email')} />`.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, required, id, className, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  // The hint is replaced by the error while there is one, so only one of the two exists in the DOM.
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-fg">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full rounded-xl border bg-surface px-3.5 py-2 text-sm text-fg outline-hidden focus:ring-1',
          error
            ? 'border-danger focus:border-danger focus:ring-danger'
            : 'border-line focus:border-accent focus:ring-accent',
          className,
        )}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
