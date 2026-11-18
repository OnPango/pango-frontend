import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Leaf, Sprout } from '../pangolin/leaves';
import { PangolinBall } from '../pangolin/PangolinBall';
import '../pangolin/pangolin.css';

/** How long a wait is before the loader says it is taking longer than usual. */
const SLOW_AFTER_MS = 6000;

/** Ball and stage in px, and how long a turn takes. The stage shrinks to fit a narrow screen. */
const SIZES = {
  /** The whole screen: the app starting, the session being restored. */
  screen: {
    ball: 120,
    stage: 380,
    turn: '2.8s',
    message: 'font-display text-2xl font-semibold text-fg sm:text-3xl',
    // The second line keeps its height, empty or not, so the loader does not jump as it changes.
    detail: 'min-h-6 text-base text-muted',
  },
  /** A section of a page: a screen's code loading, a card waiting for its data. */
  section: {
    ball: 60,
    stage: 220,
    turn: '2s',
    message: 'text-sm text-fg/80',
    detail: 'text-xs text-muted empty:hidden',
  },
} as const;

export interface PangolinLoaderProps {
  /** What is loading, as a sentence: "Pango está verificando tu sesión". */
  message: string;
  /** A second, quieter line: the address being looked up. */
  detail?: string;
  /** Said on the second line once the same message has been up for `slowAfterMs`. */
  slowMessage?: string;
  slowAfterMs?: number;
  size?: keyof typeof SIZES;
  /** Nothing shows for this long, so a quick load does not flash it. */
  delayMs?: number;
  className?: string;
  /** Shown below the text: the boot screen's progress. */
  children?: ReactNode;
}

/**
 * Pango rolled up into a ball, rolling along: the ground and the sprouts go by, dust puffs up
 * behind it and it kicks up a leaf now and then. What is loading is written below; when the message
 * changes (the next step of a progress) the new one fades in. Screen readers hear each message, and
 * the slow message if a wait goes on. Without motion (`prefers-reduced-motion`) it is a still picture.
 */
export function PangolinLoader({
  message,
  detail,
  slowMessage,
  slowAfterMs = SLOW_AFTER_MS,
  size = 'section',
  delayMs = 300,
  className,
  children,
}: PangolinLoaderProps) {
  // The message that has been up too long. A new message starts its own wait.
  const [slowFor, setSlowFor] = useState<string | null>(null);

  useEffect(() => {
    if (!slowMessage) return;
    const timer = window.setTimeout(() => setSlowFor(message), slowAfterMs);
    return () => window.clearTimeout(timer);
  }, [message, slowMessage, slowAfterMs]);

  const slow = slowFor === message && !!slowMessage;
  const { ball, stage, turn, ...text } = SIZES[size];
  // The ball sits on the ground (8px up); above it there is room for the kicked leaves.
  const height = Math.round(ball * 1.65);
  const sky = height - ball - 8;
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
        className="pango-stage pointer-events-none max-w-full"
        // The empty sky reaches up over what is above, so only the ball and the ground count when
        // the loader is centered: otherwise the ball and the message would sit low.
        style={{ width: stage, height, marginTop: -sky }}
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
      <div key={message} className="pango-text-in flex flex-col items-center gap-2 text-center">
        <p className={text.message}>{message}</p>
        <p className={text.detail}>{slow ? slowMessage : detail}</p>
      </div>
      {children}
    </div>
  );
}
