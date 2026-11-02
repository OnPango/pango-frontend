import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import { cn } from '@/shared/lib/cn';

const badgeStyles = cva(
  'inline-flex shrink-0 items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap',
  {
    variants: {
      size: {
        sm: 'px-2 py-0.5 text-[11px]',
        md: 'px-2.5 py-0.5 text-xs',
      },
      tone: {
        neutral: '',
        primary: '',
        secondary: '',
        success: '',
        warning: '',
        danger: '',
      },
      appearance: { soft: '', outline: '', solid: '' },
    },
    compoundVariants: [
      { tone: 'neutral', appearance: 'soft', class: 'border-line2 bg-fg/5 text-fg' },
      {
        tone: 'primary',
        appearance: 'soft',
        class: 'border-primary/30 bg-primary/10 text-primary',
      },
      {
        tone: 'secondary',
        appearance: 'soft',
        class: 'border-secondary/30 bg-secondary/10 text-secondary',
      },
      {
        tone: 'success',
        appearance: 'soft',
        class: 'border-success/30 bg-success/10 text-success',
      },
      {
        tone: 'warning',
        appearance: 'soft',
        class: 'border-warning/30 bg-warning/10 text-warning',
      },
      { tone: 'danger', appearance: 'soft', class: 'border-danger/30 bg-danger/10 text-danger' },

      { tone: 'neutral', appearance: 'outline', class: 'border-line2 bg-transparent text-fg' },
      {
        tone: 'primary',
        appearance: 'outline',
        class: 'border-primary bg-transparent text-primary',
      },
      {
        tone: 'secondary',
        appearance: 'outline',
        class: 'border-secondary bg-transparent text-secondary',
      },
      {
        tone: 'success',
        appearance: 'outline',
        class: 'border-success bg-transparent text-success',
      },
      {
        tone: 'warning',
        appearance: 'outline',
        class: 'border-warning bg-transparent text-warning',
      },
      { tone: 'danger', appearance: 'outline', class: 'border-danger bg-transparent text-danger' },

      { tone: 'neutral', appearance: 'solid', class: 'border-fg bg-fg text-canvas' },
      { tone: 'primary', appearance: 'solid', class: 'border-primary bg-primary text-primary-fg' },
      {
        tone: 'secondary',
        appearance: 'solid',
        class: 'border-secondary bg-secondary text-secondary-fg',
      },
      { tone: 'success', appearance: 'solid', class: 'border-success bg-success text-canvas' },
      { tone: 'warning', appearance: 'solid', class: 'border-warning bg-warning text-canvas' },
      { tone: 'danger', appearance: 'solid', class: 'border-danger bg-danger text-canvas' },
    ],
    defaultVariants: { size: 'md', tone: 'neutral', appearance: 'soft' },
  },
);

export interface BadgeProps extends VariantProps<typeof badgeStyles> {
  /** Leading icon. Status badges should carry an icon or a dot, never rely on color alone. */
  icon?: IconType;
  /** Small colored dot before the text (alternative to `icon`). */
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

/** Small label for a status, category or count. */
export function Badge({
  icon: Icon,
  dot = false,
  size,
  tone,
  appearance,
  className,
  children,
}: BadgeProps) {
  return (
    <span className={cn(badgeStyles({ size, tone, appearance }), className)}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {Icon && <Icon aria-hidden className="size-3.5 shrink-0" />}
      {children}
    </span>
  );
}
