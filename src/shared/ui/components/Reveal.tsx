import type { ElementType, ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

interface RevealProps {
  /** Delay in ms: stagger siblings by passing `index * 60`. */
  delay?: number;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

/** Fades and rises its content into place on mount. Motion is disabled by `prefers-reduced-motion`. */
export function Reveal({ delay = 0, as: Tag = 'div', className, children }: RevealProps) {
  return (
    <Tag className={cn('animate-fade-up', className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}
