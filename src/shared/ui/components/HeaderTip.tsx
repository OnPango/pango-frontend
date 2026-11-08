import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { useDismiss } from './form/useDismiss';

export interface HeaderTipProps {
  label: string;
  title: string;
  children: ReactNode;
  /** Alignment of the popover relative to the trigger. Default: 'center'. */
  align?: 'left' | 'center' | 'right';
  className?: string;
}

const ALIGN_CLASSES = {
  left: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  right: 'right-0',
} as const;

/**
 * An accessible tooltip/popover trigger (typically '?' in table headers) that displays
 * extra context. Closes when clicking outside or pressing Escape.
 */
export function HeaderTip({ label, title, children, align = 'center', className }: HeaderTipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Close when clicking outside
  useDismiss(detailsRef, isOpen, () => {
    setIsOpen(false);
    if (detailsRef.current) detailsRef.current.open = false;
  });

  // Close on Escape key and return focus to summary
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setIsOpen(false);
        if (detailsRef.current) {
          detailsRef.current.open = false;
          detailsRef.current.querySelector('summary')?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <details
      ref={detailsRef}
      onToggle={(e) => setIsOpen((e.currentTarget as HTMLDetailsElement).open)}
      className={cn('relative ml-1 inline-block align-middle', className)}
    >
      <summary
        aria-label={label}
        className="grid size-5 cursor-pointer list-none place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary transition marker:hidden hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden"
      >
        ?
      </summary>
      <div
        className={cn(
          'absolute top-7 z-20 w-64 rounded-xl bg-fg p-3 text-left text-xs leading-relaxed font-normal text-canvas normal-case shadow-lg',
          ALIGN_CLASSES[align],
        )}
      >
        <b className="text-primary">{title}</b>
        <br />
        {children}
      </div>
    </details>
  );
}
