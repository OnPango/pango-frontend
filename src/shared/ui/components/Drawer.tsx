import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IoClose } from 'react-icons/io5';
import { Button } from './Button';

export interface DrawerProps {
  title: string;
  description?: string;
  /** Called on Esc, backdrop click and the close button. The parent decides whether to unmount. */
  onClose: () => void;
  children: ReactNode;
  /** Action bar pinned below the scrolling body. */
  footer?: ReactNode;
}

/**
 * Side panel for a record's detail, sliding from the right. Built on the native `<dialog>` like
 * `Modal` (focus trap, Esc, inert background, focus restoration). Mount it only while it is open.
 * At phone width it takes the whole screen.
 */
export function Drawer({ title, description, onClose, children, footer }: DrawerProps) {
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
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="my-0 mr-0 ml-auto h-dvh max-h-dvh w-full max-w-md overflow-hidden border-l border-line2 bg-surface p-0 text-fg shadow-2xl backdrop:backdrop-blur-xl"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-line2 px-6 pt-5 pb-4">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-xl font-bold text-fg">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-0.5 text-xs text-muted">
                {description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="-mt-1 -mr-2 rounded-full p-2 text-muted hover:bg-fg/5 hover:text-fg"
            aria-label="Cerrar panel"
          >
            <IoClose aria-hidden className="size-5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line2 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
