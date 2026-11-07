import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IoClose } from 'react-icons/io5';
import { cn } from '@/shared/lib/cn';
import { Button } from './Button';

export interface ModalProps {
  title: string;
  description?: string;
  /** Called on Esc, backdrop click and the close button. The parent decides whether to unmount. */
  onClose: () => void;
  children: ReactNode;
  /** Action bar pinned below the scrolling body. */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Disable while saving so a half-finished request cannot be dismissed by accident. */
  dismissible?: boolean;
}

const WIDTHS = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

/**
 * Dialog built on the native `<dialog>`: focus trap, Esc handling, inert background and focus
 * restoration come from the browser. Mount it only while it is open (`{open && <Modal …/>}`) so its
 * content (and form state) starts fresh each time.
 */
export function Modal({
  title,
  description,
  onClose,
  children,
  footer,
  size = 'md',
  dismissible = true,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    // The native dialog already handles Esc (onCancel); the backdrop click is a pointer convenience.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && dismissible) onClose();
      }}
      className={cn(
        'm-auto w-[calc(100%-2rem)] overflow-hidden rounded-3xl border border-line2 bg-surface p-0 text-fg shadow-2xl backdrop:bg-fg/40 backdrop:backdrop-blur-xs',
        WIDTHS[size],
      )}
    >
      <div className="flex max-h-[90dvh] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-line2 px-6 pt-5 pb-4 sm:px-8">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-bold text-fg">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-0.5 text-xs text-muted">
                {description}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={!dismissible}
            className="-mt-1 -mr-2 rounded-full p-2 text-muted hover:bg-fg/5 hover:text-fg focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar ventana"
          >
            <IoClose className="size-5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-line2 px-6 py-4 sm:px-8">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
