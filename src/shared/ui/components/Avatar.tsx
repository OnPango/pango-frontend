import { cva, type VariantProps } from 'class-variance-authority';
import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { getInitials } from '@/shared/lib/initials';

const avatarStyles = cva(
  'inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold select-none',
  {
    variants: {
      size: {
        xs: 'size-6 text-[10px]',
        sm: 'size-8 text-xs',
        md: 'size-10 text-sm',
        lg: 'size-12 text-base',
        xl: 'size-16 text-xl',
      },
      tone: { primary: '', secondary: '', neutral: '' },
      appearance: { solid: '', soft: '' },
    },
    compoundVariants: [
      { tone: 'primary', appearance: 'solid', class: 'bg-primary text-primary-fg' },
      { tone: 'secondary', appearance: 'solid', class: 'bg-secondary text-secondary-fg' },
      { tone: 'neutral', appearance: 'solid', class: 'bg-fg text-canvas' },
      { tone: 'primary', appearance: 'soft', class: 'bg-primary/20 text-primary' },
      { tone: 'secondary', appearance: 'soft', class: 'bg-secondary/20 text-secondary' },
      { tone: 'neutral', appearance: 'soft', class: 'bg-fg/10 text-fg' },
    ],
    defaultVariants: { size: 'md', tone: 'primary', appearance: 'solid' },
  },
);

export interface AvatarProps extends VariantProps<typeof avatarStyles> {
  /** Person's full name: source of the initials and of the accessible name. */
  name: string;
  /** Photo URL. If missing or broken, the initials are shown. */
  src?: string | null;
  /** Hide it from assistive tech when the name is already written next to it. */
  decorative?: boolean;
  className?: string;
}

/** Round avatar: photo with an initials fallback. */
export function Avatar({
  name,
  src,
  size,
  tone,
  appearance,
  decorative = false,
  className,
}: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = !!src && failedSrc !== src;

  return (
    <span
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      className={cn(avatarStyles({ size, tone, appearance }), className)}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailedSrc(src)}
          className="size-full object-cover"
        />
      ) : (
        getInitials(name) || '?'
      )}
    </span>
  );
}
