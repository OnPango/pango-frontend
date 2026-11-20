import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';
import { cn } from '@/shared/lib/cn';
import { Button } from './Button';

const alertStyles = cva('flex items-start gap-3 rounded-xl border px-4 py-3 text-sm', {
  variants: {
    tone: {
      danger: 'border-danger/30 bg-danger/10 text-danger',
      warning: 'border-warning/30 bg-warning/10 text-warning',
      success: 'border-success/30 bg-success/10 text-success',
      info: 'border-primary/30 bg-primary/10 text-primary',
    },
  },
  defaultVariants: { tone: 'info' },
});

const ICONS = {
  danger: FiAlertCircle,
  warning: FiAlertTriangle,
  success: FiCheckCircle,
  info: FiInfo,
} as const;

export interface AlertProps extends VariantProps<typeof alertStyles> {
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

/** Inline message for the result of an action or a problem in a form/page. */
export function Alert({ tone = 'info', title, children, onDismiss, className }: AlertProps) {
  const Icon = ICONS[tone ?? 'info'];
  return (
    <div
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
      className={cn(alertStyles({ tone }), className)}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && 'mt-0.5', 'text-fg/90')}>{children}</div>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          onClick={onDismiss}
          aria-label="Cerrar aviso"
          className="-my-1 -mr-1 size-7 shrink-0 rounded-full p-0 text-current focus-visible:outline-hidden"
        >
          <FiX aria-hidden className="size-4" />
        </Button>
      )}
    </div>
  );
}
