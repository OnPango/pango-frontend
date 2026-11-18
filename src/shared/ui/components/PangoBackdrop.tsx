import type { CSSProperties } from 'react';
import { asset } from '@/shared/lib/asset';
import { Leaf } from '../pangolin/leaves';
import '../pangolin/backdrop.css';

/** The leaf of `leaves.tsx`, as a path to draw inside the corner pictures. */
const LEAF = 'M2,22 C2,12 10,3 22,2 C22,13 13,22 2,22 Z';
const LEAF_VEIN = 'M3,21 C8,16 13,11 18,6';

interface PangoBackdropProps {
  /** The logo in the top left corner. Off where the page already shows it (inside the app). */
  brand?: boolean;
  /** Wait before it fades in, so a quick load never flashes it. 0 shows it at once. */
  delayMs?: number;
}

/**
 * The full-screen background of the loading and error screens: irregular patches of sand and copper
 * in the corners that slowly drift, thin lines, leaves swaying on them and a few drifting across.
 * Decoration only. Place it first inside a `relative` container, and lift the content above it
 * (`relative`).
 */
export function PangoBackdrop({ brand = true, delayMs = 300 }: PangoBackdropProps) {
  return (
    <div
      className="pbd"
      aria-hidden="true"
      style={{ '--pbd-delay': `${delayMs}ms` } as CSSProperties}
    >
      {/* Top right: a patch of sand with a leaf at its foot. */}
      <svg className="pbd-corner pbd-top-right" viewBox="0 0 160 230" focusable="false">
        <path
          className="pbd-shape pbd-sand"
          d="M200,0 L200,22 L160,22 C140,16 114,22 100,40 C88,56 96,74 84,90 C70,108 56,124 62,148 C70,178 100,192 126,186 C140,183 152,176 160,170 L200,170 Z"
        />
        <SceneLeaf x={84} y={150} size={70} rotate={-28} delay={-1.5} />
      </svg>

      {/* Bottom left: sand, the copper hill over it with its deeper foot, a line and a leaf. */}
      <svg className="pbd-corner pbd-bottom-left" viewBox="0 0 400 400" focusable="false">
        <path
          className="pbd-shape pbd-sand"
          d="M-40,-10 L0,0 C34,4 56,30 64,64 C72,98 70,122 98,150 C130,184 188,198 238,236 C288,274 318,330 334,400 L340,440 L-40,440 Z"
        />
        <path
          className="pbd-line pbd-line-left"
          d="M-40,104 L0,104 C52,106 98,136 114,184 C128,228 118,300 142,400 L146,440"
        />
        <g className="pbd-shape pbd-copper-hill">
          <path
            className="pbd-copper"
            d="M-40,180 L0,168 C16,150 46,136 80,140 C118,145 142,170 168,206 C202,254 230,318 246,400 L250,440 L-40,440 Z"
          />
          <path
            className="pbd-copper-deep"
            d="M-40,310 L0,300 C38,282 90,284 134,310 C166,330 188,362 196,400 L198,440 L-40,440 Z"
          />
        </g>
        <SceneLeaf x={178} y={248} size={62} rotate={6} delay={-3} />
      </svg>

      {/* Bottom right: sand rising to the edge, a line over it, and a leaf beside a pebble. */}
      <svg className="pbd-corner pbd-bottom-right" viewBox="0 0 340 300" focusable="false">
        <path
          className="pbd-shape pbd-sand pbd-sand-late"
          d="M58,300 C66,256 98,224 146,206 C190,190 206,160 236,124 C264,90 300,72 340,64 L380,60 L380,340 L54,340 Z"
        />
        <path
          className="pbd-line pbd-line-right"
          d="M-14,340 L8,300 C54,214 128,152 212,110 C262,86 304,62 340,40 L380,16"
        />
        <ellipse className="pbd-pebble" cx="236" cy="238" rx="18" ry="8" />
        <SceneLeaf x={222} y={176} size={58} rotate={-12} delay={-0.5} />
      </svg>

      <div className="pbd-drift pbd-drift-1">
        <Leaf />
      </div>
      <div className="pbd-drift pbd-drift-2">
        <Leaf />
      </div>
      <div className="pbd-drift pbd-drift-3">
        <Leaf />
      </div>

      {/* The brand in the top left corner: brown, or cream on the dark theme. */}
      {brand && (
        <div className="pbd-brand">
          <img
            src={asset('logos/pango-logo-horizontal-marron.svg')}
            alt=""
            className="dark:hidden"
          />
          <img
            src={asset('logos/pango-logo-horizontal-crema.svg')}
            alt=""
            className="hidden dark:block"
          />
        </div>
      )}
    </div>
  );
}

/** A leaf drawn in a corner picture: its stem at (x, y), swaying from it. */
function SceneLeaf({
  x,
  y,
  size,
  rotate,
  delay,
}: {
  x: number;
  y: number;
  size: number;
  rotate: number;
  delay: number;
}) {
  const scale = size / 24;
  return (
    <g transform={`translate(${x} ${y - size}) rotate(${rotate} 0 ${size}) scale(${scale})`}>
      <g className="pbd-leaf" style={{ animationDelay: `${delay}s` }}>
        <path d={LEAF} fill="currentColor" />
        <path
          d={LEAF_VEIN}
          fill="none"
          stroke="#fff"
          strokeOpacity="0.18"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </g>
    </g>
  );
}
