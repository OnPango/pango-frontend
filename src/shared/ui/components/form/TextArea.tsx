import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';
import { bareInputClass, controlStyles } from './control.styles';
import { Field } from './Field';
import { useFieldIds } from './useFieldIds';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  /** Shows "(opcional)" after the label. */
  optional?: boolean;
  error?: string;
  containerClassName?: string;
}

/** Multi-line text input; same look and field wiring as `TextBox`. */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  {
    label,
    hint,
    optional,
    error,
    containerClassName,
    className,
    id: idProp,
    required,
    disabled,
    rows = 3,
    ...props
  },
  ref,
) {
  const { id, hintId, errorId, describedBy } = useFieldIds(idProp, hint, error);

  return (
    <Field
      id={id}
      hintId={hintId}
      errorId={errorId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      className={containerClassName}
    >
      <div className={cn(controlStyles({ invalid: !!error, disabled: !!disabled }), 'items-start')}>
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(bareInputClass, 'resize-y leading-relaxed', className)}
          {...props}
        />
      </div>
    </Field>
  );
});
