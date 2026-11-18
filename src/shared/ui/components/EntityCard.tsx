import type { ReactNode } from 'react';
import { useThemeStore } from '@/core/theme/theme.store';
import { resolveBackground } from '@/shared/lib/backgrounds';
import { cn } from '@/shared/lib/cn';

export interface CardPatternBannerProps {
  /** Deterministic seed (such as entity id or pattern name) for the SVG background. */
  seed: string;
  isActive?: boolean;
  className?: string;
}

/** Decorative SVG pattern banner cropped to its container for catalog cards and detail drawers. */
export function CardPatternBanner({ seed, isActive = true, className }: CardPatternBannerProps) {
  const theme = useThemeStore((state) => state.resolved);
  const { src, dimmed } = resolveBackground(seed, theme);

  return (
    <div className={cn('h-28 overflow-clip bg-canvas', className)}>
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn(
          'block size-full object-cover',
          dimmed && 'brightness-75',
          !isActive && 'opacity-60 grayscale',
        )}
      />
    </div>
  );
}

export interface EntityCardProps {
  /** Optional SVG pattern seed. When omitted, renders a clean card without top banner. */
  patternSeed?: string;
  isActive?: boolean;
  avatar?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Shared card shell for entity grids: optional SVG banner, header with status badge, body and footer actions. */
export function EntityCard({
  patternSeed,
  isActive = true,
  avatar,
  title,
  subtitle,
  badge,
  children,
  footer,
  className,
}: EntityCardProps) {
  return (
    <article
      className={cn(
        'flex w-full min-w-0 flex-col overflow-clip rounded-2xl border border-line2 bg-surface transition-transform duration-300 hover:scale-105',
        className,
      )}
    >
      {patternSeed !== undefined && <CardPatternBanner seed={patternSeed} isActive={isActive} />}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {avatar}
            <div className="min-w-0 flex-1">
              <h3 className="min-w-0 text-lg leading-tight font-bold wrap-break-word text-fg">
                {title}
              </h3>
              {subtitle && <div className="mt-0.5 truncate text-xs text-muted">{subtitle}</div>}
            </div>
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        {children}
        {footer && (
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
            {footer}
          </div>
        )}
      </div>
    </article>
  );
}
