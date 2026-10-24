import { VscChromeClose } from 'react-icons/vsc';
import { useEffect, useRef } from 'react';
import { SidebarContentMobile } from './SidebarContentMobile';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Mobile navigation drawer (below md). Uses a native modal <dialog>, which gives us for free:
 * focus trap, Escape to close, inert page behind it and focus restore on close.
 */
export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  // A click on the backdrop targets the <dialog> element itself. Keyboard users close it with
  // Escape (native), so this is a pointer-only convenience and is attached outside JSX.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const closeOnBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) onClose();
    };
    dialog.addEventListener('click', closeOnBackdropClick);
    return () => dialog.removeEventListener('click', closeOnBackdropClick);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      id="mobile-nav"
      aria-label="Menú de navegación"
      onClose={onClose}
      className="fixed inset-0 size-full max-h-none max-w-none bg-fg/5 text-sidebar-fg backdrop-blur-md transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none lg:hidden starting:translate-y-4 starting:opacity-0"
    >
      {isOpen && (
        <SidebarContentMobile
          onNavigate={onClose}
          headerAction={
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar menú"
              className="rounded-lg p-1.5 text-sidebar-fg/80 transition hover:bg-sidebar-fg/10 hover:text-sidebar-fg focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:outline-hidden"
            >
              <VscChromeClose aria-hidden className="size-5" />
            </button>
          }
        />
      )}
    </dialog>
  );
}
