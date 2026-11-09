import { useLayoutEffect, type RefObject } from 'react';

export interface DialogExitClasses {
  /** The dialog's entrance class, swapped for `exit` on the copy. */
  enter: string;
  exit: string;
  /** Look of the dialog's `::backdrop` (a pseudo-element cannot be copied), plus its exit. */
  backdrop: string;
}

/** Longest exit (see `--animate-*-out` in `styles/index.css`) plus a margin, in case `animationend` never fires. */
const MAX_EXIT_MS = 400;

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Exit animation for a `<dialog>` that its parent unmounts to close it (`{open && <Modal/>}`).
 * Right before React removes it, a copy of what is on screen (backdrop and panel, with the typed
 * values and the scroll position) is put in the top layer and animated out, then removed. The copy
 * is inert and `aria-hidden`: focus and screen readers already moved on with the real dialog.
 *
 * Skipped with `prefers-reduced-motion`, and where the Popover API is missing (the copy needs the
 * top layer to show above other open dialogs).
 */
export function useDialogExit(
  ref: RefObject<HTMLDialogElement | null>,
  classes: DialogExitClasses,
) {
  const { enter, exit, backdrop } = classes;

  useLayoutEffect(() => {
    const dialog = ref.current;
    return () => {
      // Layout cleanups run before React detaches the DOM, so the dialog is still on screen here.
      if (!dialog?.open || prefersReducedMotion()) return;
      const layer = document.createElement('div');
      if (typeof layer.showPopover !== 'function') return;

      const rect = dialog.getBoundingClientRect();
      const panel = document.createElement('div');
      panel.className = dialog.className.replace(enter, exit);
      Object.assign(panel.style, {
        position: 'fixed',
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: '0',
      });
      panel.append(...Array.from(dialog.childNodes, (node) => node.cloneNode(true)));
      // Without ids, names and form links the copy cannot clash with a dialog opened right after.
      panel.querySelectorAll('*').forEach((el) => {
        for (const attribute of [
          'id',
          'name',
          'for',
          'form',
          'aria-labelledby',
          'aria-describedby',
        ]) {
          el.removeAttribute(attribute);
        }
      });

      const shade = document.createElement('div');
      shade.className = backdrop;
      Object.assign(shade.style, { position: 'fixed', inset: '0' });

      layer.setAttribute('popover', 'manual');
      layer.setAttribute('inert', '');
      layer.setAttribute('aria-hidden', 'true');
      // Undo the browser's popover box: the layer is only a full-screen, click-through container.
      Object.assign(layer.style, {
        position: 'fixed',
        inset: '0',
        width: '100%',
        height: '100%',
        maxWidth: 'none',
        maxHeight: 'none',
        margin: '0',
        padding: '0',
        border: '0',
        background: 'transparent',
        overflow: 'visible',
        pointerEvents: 'none',
      });
      layer.append(shade, panel);

      // Same scroll position as the original, element by element.
      const scrolled = Array.from(dialog.querySelectorAll<HTMLElement>('*'), (el) => el.scrollTop);

      // StrictMode runs this cleanup on a dialog that stays mounted; only show the copy once the
      // dialog is really gone from the page (React removes it in this same commit).
      queueMicrotask(() => {
        if (dialog.isConnected) return;
        document.body.append(layer);
        layer.showPopover();
        panel.querySelectorAll<HTMLElement>('*').forEach((el, index) => {
          if (scrolled[index]) el.scrollTop = scrolled[index];
        });
        const remove = () => layer.remove();
        panel.addEventListener('animationend', remove, { once: true });
        setTimeout(remove, MAX_EXIT_MS);
      });
    };
  }, [ref, enter, exit, backdrop]);
}
