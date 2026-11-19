import { type ReactNode } from 'react';
import { PangolinBall } from '@/shared/ui/pangolin/PangolinBall';
import './error-scene.css';

/** The picture's canvas. The ground, where Pango rests, is at y = 262. */
const WIDTH = 640;
/** Pango's size in the picture's units. */
const BALL = 112;

/** The leaf of `leaves.tsx`: its stem at (2, 22), its tip towards the top right. */
const LEAF = 'M2,22 C2,12 10,3 22,2 C22,13 13,22 2,22 Z';

/** A leaf with its stem at (x, y), `tilt` degrees from upright, `size` units long. */
export function SceneLeaf({
  x,
  y,
  tilt,
  size,
  soft = false,
}: {
  x: number;
  y: number;
  tilt: number;
  size: number;
  /** A paler leaf, for the far side of the picture. */
  soft?: boolean;
}) {
  const scale = size / 28;
  return (
    <path
      className={soft ? 'es-leaf-soft' : 'es-leaf'}
      d={LEAF}
      transform={`translate(${x} ${y}) rotate(${tilt - 45}) scale(${scale}) translate(-2 -22)`}
    />
  );
}

interface ErrorSceneProps {
  /** The big faded code behind the picture. Without it, the page draws its own backdrop. */
  code?: string;
  /** Where Pango comes to rest: the center of the ball, in the picture's units. */
  pangoX: number;
  /**
   * How Pango arrives: it rolls in and `stop`s, or it `bump`s into something just ahead and rolls
   * back a little.
   */
  arrival: 'stop' | 'bump';
  /** The rest of the picture, in a 640 × 300 SVG drawn over the code. */
  children: ReactNode;
}

/**
 * The frame of the error pictures: the big faded code, the scenery each page draws, and Pango
 * rolling in from the left. Decoration only.
 */
export function ErrorScene({ code, pangoX, arrival, children }: ErrorSceneProps) {
  return (
    <div className={`es-scene es-arrive-${arrival}`} aria-hidden="true">
      <svg viewBox="0 0 640 300" focusable="false" className="es-art">
        {code && (
          <text x="320" y="236" textAnchor="middle" className="es-code font-display">
            {code}
          </text>
        )}
        {children}
        <ellipse className="es-shadow" cx={pangoX} cy="262" rx={BALL / 2} ry="6" />
      </svg>

      {/* Pango, rolled up, on top of the picture, facing right. */}
      <div className="es-pango" style={{ left: `${((pangoX - BALL / 2) / WIDTH) * 100}%` }}>
        <PangolinBall className="es-ball" />
      </div>
    </div>
  );
}
