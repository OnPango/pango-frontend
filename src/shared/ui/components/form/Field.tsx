import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export interface FieldProps {
  /** Id of the control the label points to. */
  id: string;
  hintId: string;
  errorId: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Shows "(opcional)" after the label. */
  optional?: boolean;
  className?: string;
  children: ReactNode;
}

/** Label + control + hint/error. Controls render themselves inside it. */
export function Field({
  id,
  hintId,
  errorId,
  label,
  hint,
  error,
  required,
  optional,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-fg">
          {label}
          {required && (
            <span aria-hidden className="ml-0.5 text-danger">
              *
            </span>
          )}
          {optional && <span className="ml-1 font-normal text-muted">(opcional)</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
