import { useEffect, useState, type CSSProperties } from 'react';
import { cn } from '@/shared/lib/cn';
import { Leaf, Sprout } from '../pangolin/leaves';
import { PangolinBall } from '../pangolin/PangolinBall';
import '../pangolin/pangolin.css';

/** How long a wait is before the loader says it is taking longer than usual. */
const SLOW_AFTER_MS = 6000;

/** Ball and stage in px, and how long a turn takes. The stage shrinks to fit a narrow screen. */
const SIZES = {
  /** The whole screen: the app starting, the session being restored. */
  screen: { ball: 120, stage: 380, turn: '2.8s', text: 'text-lg' },
  /** A section of a page: a screen's code loading, a card waiting for its data. */
  section: { ball: 60, stage: 220, turn: '2s', text: 'text-sm' },
} as const;

export interface PangolinLoaderProps {
  /** What is loading, as a sentence: "Verificando tu sesión…". */
  message: string;
  /** Said instead once the wait reaches `slowAfterMs`. */
  slowMessage?: string;
  slowAfterMs?: number;
  size?: keyof typeof SIZES;
  /** Nothing shows for this long, so a quick load does not flash it. */
  delayMs?: number;
  className?: string;
}

/**
 * Pango rolled up into a ball, rolling along: the ground and the sprouts go by, dust puffs up
 * behind it and it kicks up a leaf now and then. What is loading is written below. Screen readers
 * hear the message, and the slow message if the wait goes on. Without motion
 * (`prefers-reduced-motion`) it is a still picture.
 */
export function PangolinLoader({
  message,
  slowMessage,
  slowAfterMs = SLOW_AFTER_MS,
  size = 'section',
  delayMs = 300,
  className,
}: PangolinLoaderProps) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!slowMessage) return;
    const timer = window.setTimeout(() => setSlow(true), slowAfterMs);
    return () => window.clearTimeout(timer);
  }, [slowMessage, slowAfterMs]);

  const { ball, stage, turn, text } = SIZES[size];
  const style = {
    '--pd': ball,
    '--pw': stage,
    '--pt': turn,
    '--pango-delay': `${delayMs}ms`,
  } as CSSProperties;

  return (
    <div
      role="status"
      style={style}
      className={cn(
        'pango-loader flex max-w-full flex-col items-center justify-center gap-4',
        className,
      )}
    >
      <div
        className="pango-stage max-w-full"
        style={{ width: stage, height: Math.round(ball * 1.65) }}
      >
        <div className="pango-ground" />
        <div className="pango-pass">
          <Sprout className="pango-sprout" />
        </div>
        <div className="pango-pass pango-pass-late">
          <Sprout className="pango-sprout" />
        </div>
        <div className="pango-shadow" />
        <div>
          <span className="pango-dust" />
          <span className="pango-dust" />
          <span className="pango-dust" />
        </div>
        <Leaf className="pango-kick" />
        <Leaf className="pango-kick pango-kick-late" />
        <div className="pango-ball">
          <PangolinBall className="pango-roll" />
        </div>
      </div>
      <p className={cn('text-center text-fg/80', text)}>
        {slow && slowMessage ? slowMessage : message}
      </p>
    </div>
  );
}
