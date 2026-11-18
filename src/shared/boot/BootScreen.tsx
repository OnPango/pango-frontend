import { useEffect, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { LoadingBackdrop } from '@/shared/ui/components/LoadingBackdrop';
import { PangolinLoader } from '@/shared/ui/components/PangolinLoader';
import { Leaf } from '@/shared/ui/pangolin/leaves';
import { useBootStore } from './boot.store';
import './boot.css';

/** The leaves of the progress: the start has at most this many steps on the way in. */
const STEPS = 3;
/** Between two steps nothing waits for an instant: only this long without steps ends the start. */
const SETTLE_MS = 150;
/** How long the screen takes to fade out (`boot.css`). */
const FADE_MS = 400;

/**
 * The screen of the app's start, mounted once above the router. It stays while any `BootStep` is
 * waiting, so the session check, the code of the first screen and the workspace lookup read as one
 * progress: Pango keeps rolling, the message changes and a leaf fills for each step done. When
 * nothing is left it fades out over the screen that is ready underneath, and is gone for good.
 */
export function BootScreen() {
  const phase = useBootStore((state) => state.phase);
  const active = useBootStore((state) => state.active);
  const started = useBootStore((state) => state.started.length);
  const last = useBootStore((state) => state.last);
  const finish = useBootStore((state) => state.finish);
  const [gone, setGone] = useState(false);

  const waiting = active.length > 0;
  useEffect(() => {
    if (phase !== 'booting' || waiting) return;
    const timer = window.setTimeout(finish, SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [phase, waiting, finish]);

  useEffect(() => {
    if (phase !== 'done') return;
    const timer = window.setTimeout(() => setGone(true), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (gone) return null;

  const current = active.at(-1) ?? last;
  // A step counts once it is over. All the leaves fill only when the start is.
  const done = phase === 'done' ? STEPS : Math.min(started - active.length, STEPS - 1);

  return (
    <div
      className={cn(
        'boot-screen fixed inset-0 z-100 flex items-center justify-center overflow-hidden bg-canvas px-4',
        phase === 'done' && 'boot-screen-leaving',
      )}
    >
      <LoadingBackdrop />
      <PangolinLoader
        size="screen"
        className="relative"
        message={current?.message ?? 'Ingresando a Pango'}
        detail={current?.detail}
        slowMessage="La conexión está tardando más de lo normal. Ya casi…"
      >
        <div className="boot-progress" aria-hidden="true">
          {Array.from({ length: STEPS }, (_, i) => (
            <Leaf
              key={i}
              className={cn(
                'boot-leaf',
                i < done && 'boot-leaf-done',
                i === done && 'boot-leaf-now',
              )}
            />
          ))}
        </div>
      </PangolinLoader>
    </div>
  );
}
