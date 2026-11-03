import { useEffect, useRef, type RefObject } from 'react';

/**
 * Plays a short horizontal shake on `ref` each time `trigger` increases (e.g. a rejected submit).
 * Uses the Web Animations API, so it does not remount the element or lose focus, and it does
 * nothing when the user prefers reduced motion.
 */
export function useShake(ref: RefObject<HTMLElement | null>, trigger: number) {
  const previous = useRef(trigger);

  useEffect(() => {
    if (trigger === previous.current) return;
    previous.current = trigger;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    ref.current?.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 400, easing: 'ease-in-out' },
    );
  }, [ref, trigger]);
}
