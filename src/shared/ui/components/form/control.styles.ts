import { cva } from 'class-variance-authority';

/**
 * Shared look of every form control (TextBox, Select, MultiSelect, DatePicker): the same border,
 * radius, height and focus ring, driven by theme tokens only. Focus is drawn with `focus-within`
 * so the ring also appears around controls that wrap an inner `<input>`.
 */
export const controlStyles = cva(
  'flex w-full items-center gap-2 border bg-surface outline-hidden text-fg transition-colors',
  {
    variants: {
      size: {
        sm: 'min-h-9 px-3 text-sm',
        md: 'min-h-11 px-3.5 text-sm',
      },
      shape: {
        xl: 'rounded-xl',
        full: 'rounded-full',
      },
      invalid: {
        true: 'border-danger focus-within:border-danger focus-within:ring-danger/25',
        false: 'border-line2 focus-within:border-primary focus-within:ring-primary/25',
      },
      disabled: {
        true: 'cursor-not-allowed bg-fg/5 opacity-60 hover:border-line2',
        false: '',
      },
    },
    defaultVariants: { size: 'md', shape: 'xl', invalid: false, disabled: false },
  },
);

/** Class for the bare `<input>` / `<textarea>` placed inside a control. */
export const bareInputClass =
  'min-w-0 flex-1 bg-transparent py-2 text-fg outline-hidden placeholder:text-muted disabled:cursor-not-allowed';
