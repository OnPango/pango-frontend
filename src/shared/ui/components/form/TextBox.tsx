import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { cn } from '@/shared/lib/cn';
import { bareInputClass, controlStyles } from './control.styles';
import { Field } from './Field';
import { useFieldIds } from './useFieldIds';

export interface TextBoxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  /** Error message. Marks the control as invalid and replaces the hint. */
  error?: string;
  leadingIcon?: IconType;
  /** Element at the end of the control (a unit, a button…). */
  trailing?: ReactNode;
  size?: 'sm' | 'md';
  shape?: 'xl' | 'full';
  /** Class for the outer wrapper (width, margins). `className` goes to the `<input>`. */
  containerClassName?: string;
}

/** Single-line text input. `type="password"` gets a show/hide toggle for free. */
export const TextBox = forwardRef<HTMLInputElement, TextBoxProps>(function TextBox(
  {
    label,
    hint,
    error,
    leadingIcon: LeadingIcon,
    trailing,
    size = 'md',
    shape = 'xl',
    containerClassName,
    className,
    id: idProp,
    type = 'text',
    required,
    disabled,
    ...props
  },
  ref,
) {
  const { id, hintId, errorId, describedBy } = useFieldIds(idProp, hint, error);
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';

  return (
    <Field
      id={id}
      hintId={hintId}
      errorId={errorId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <div className={cn(controlStyles({ size, shape, invalid: !!error, disabled: !!disabled }))}>
        {LeadingIcon && <LeadingIcon aria-hidden className="size-4 shrink-0 text-muted" />}
        <input
          ref={ref}
          id={id}
          type={isPassword && revealed ? 'text' : type}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(bareInputClass, className)}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            disabled={disabled}
            aria-label={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={revealed}
            className="-mr-1 grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-muted transition hover:text-fg focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-hidden"
          >
            {revealed ? <FiEyeOff className="size-4" /> : <FiEye className="size-4" />}
          </button>
        )}
        {trailing}
      </div>
    </Field>
  );
});
