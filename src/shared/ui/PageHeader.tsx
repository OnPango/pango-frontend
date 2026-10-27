import type { IconType } from 'react-icons';
import { cn } from '@/shared/lib/cn';
import { Button } from './components/Button';

export function PageHeader({
  title,
  subtitle,
  onAction,
  icon: Icon,
  actionText,
  className,
}: {
  title: string;
  subtitle?: string;
  onAction?: () => void;
  icon?: IconType;
  actionText?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-4 rounded-2xl bg-primary/5 p-8', className)}>
      <h2 className="text-3xl font-bold lg:text-4xl">{title}</h2>
      {subtitle && <p className="text-lg font-light">{subtitle}</p>}
      {onAction && (
        <Button
          type="button"
          variant="primary"
          onClick={onAction}
          className="flex items-center gap-2 self-start rounded-2xl py-3"
        >
          {Icon && <Icon className="size-4" />}
          <span>{actionText || 'Nuevo'}</span>
        </Button>
      )}
    </div>
  );
}
