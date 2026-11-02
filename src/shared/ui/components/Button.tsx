import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';
import { Spinner } from './Spinner';

const buttonStyles = cva(
  'inline-flex items-center justify-center rounded-xl cursor-pointer font-semibold transition focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-fg hover:bg-primary/80 focus-visible:ring-primary/50',
        secondary:
          'bg-secondary text-secondary-fg hover:bg-secondary/80 focus-visible:ring-secondary/50',
        accent: 'bg-accent text-accent-fg hover:bg-accent/80 focus-visible:ring-accent/50',
        outline:
          'border border-line2 bg-surface text-fg hover:bg-fg/5 focus-visible:ring-primary/50',
        ghost: 'text-fg hover:bg-fg/10 focus-visible:ring-primary/50',
        danger: 'bg-danger text-canvas hover:bg-danger/80 focus-visible:ring-danger/50',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-5 py-2.5 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonStyles> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, isLoading = false, disabled, className, type = 'button', children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(buttonStyles({ variant, size }), className)}
      {...props}
    >
      {isLoading && <Spinner />}
      {children}
    </button>
  );
});
