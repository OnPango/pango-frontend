import { useEffect, type ReactNode } from 'react';
import { useBootStore } from './boot.store';

interface BootStepProps {
  /** Stable for the wait: the same id is one step, however often it renders. */
  id: string;
  message: string;
  detail?: string;
  /** What to show for this wait once the app has started (an inline loader). */
  fallback?: ReactNode;
}

/**
 * A wait that is part of the app's start. While the app is starting it renders nothing and puts
 * its message on the boot screen, so the waits on the way in read as one progress; after that it
 * renders `fallback`.
 */
export function BootStep({ id, message, detail, fallback = null }: BootStepProps) {
  const booting = useBootStore((state) => state.phase === 'booting');
  const start = useBootStore((state) => state.start);
  const end = useBootStore((state) => state.end);

  useEffect(() => {
    if (!booting) return;
    start({ id, message, detail });
    return () => end(id);
  }, [booting, id, message, detail, start, end]);

  return booting ? null : fallback;
}
