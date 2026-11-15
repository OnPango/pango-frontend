import { useState } from 'react';
import type { IconType } from 'react-icons';
import { useThemeStore } from '@/core/theme/theme.store';
import { BACKGROUNDS, getBackgroundByIndex, resolveBackground } from '@/shared/lib/backgrounds';
import { cn } from '@/shared/lib/cn';
import { Button } from './components/Button';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onAction?: () => void;
  icon?: IconType;
  actionText?: string;
  className?: string;
  /** Optional background image URL or pattern name. If omitted, a random pattern is chosen. */
  background?: string;
  /** Optional opacity class for the background image (default: 'opacity-5'). */
  imageOpacity?: string;
}

export function PageHeader({
  title,
  subtitle,
  onAction,
  icon: Icon,
  actionText,
  className,
  background,
  imageOpacity = 'opacity-5',
}: PageHeaderProps) {
  const theme = useThemeStore((state) => state.resolved);

  // Pick a random background pattern on mount so re-renders don't cause image flickering
  const [randomIndex] = useState(() => Math.floor(Math.random() * BACKGROUNDS.length));

  const { src, dimmed } = background
    ? resolveBackground(background, theme)
    : getBackgroundByIndex(randomIndex, theme);

  return (
    <div
      className={cn(
        'relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-primary/5 p-8',
        className,
      )}
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className={cn(
          'pointer-events-none absolute inset-0 size-full object-cover',
          imageOpacity,
          dimmed && 'brightness-75',
        )}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-primary/15" />
      <h2 className="relative z-10 text-3xl font-bold lg:text-4xl">{title}</h2>
      {subtitle && <p className="relative z-10 text-lg font-light">{subtitle}</p>}
      {onAction && (
        <Button
          type="button"
          variant="primary"
          onClick={onAction}
          className="relative z-10 flex items-center gap-2 self-start rounded-2xl py-3"
        >
          {Icon && <Icon className="size-4" />}
          <span>{actionText || 'Nuevo'}</span>
        </Button>
      )}
    </div>
  );
}
