import { PangolinBall } from '@/shared/ui/pangolin/PangolinBall';
import './not-found.css';

/** The leaf of `leaves.tsx`: its stem at (2, 22), its tip towards the top right. */
const LEAF = 'M2,22 C2,12 10,3 22,2 C22,13 13,22 2,22 Z';

/** A leaf with its stem at (x, y), `tilt` degrees from upright, `size` units long. */
function SceneLeaf({ x, y, tilt, size }: { x: number; y: number; tilt: number; size: number }) {
  const scale = size / 28;
  return (
    <path
      className="nf-leaf"
      d={LEAF}
      transform={`translate(${x} ${y}) rotate(${tilt - 45}) scale(${scale}) translate(-2 -22)`}
    />
  );
}

/**
 * The picture of the 404: Pango rolls in along a winding trail and stops before a sign that says
 * the way ends here, with the big faded "404" behind. Decoration only.
 */
export function NotFoundScene() {
  return (
    <div className="nf-scene" aria-hidden="true">
      <svg viewBox="0 0 640 300" focusable="false" className="nf-art">
        <text x="320" y="236" textAnchor="middle" className="nf-code font-display">
          404
        </text>

        {/* The trail, winding off towards the sign. */}
        <path
          className="nf-trail"
          d="M40,262 C170,278 330,272 420,254 C482,241 474,222 424,220 C382,218 404,203 470,205 C502,206 524,210 548,214"
        />

        {/* The sign: the way ends here. */}
        <ellipse className="nf-pebble" cx="560" cy="216" rx="20" ry="6" />
        <rect className="nf-post" x="556" y="150" width="8" height="66" rx="3" />
        <g className="nf-sign">
          <circle className="nf-sign-face" cx="560" cy="148" r="21" />
          <path className="nf-sign-x" d="M553,141 L567,155 M567,141 L553,155" />
        </g>

        {/* Leaves and pebbles along the way. */}
        <SceneLeaf x={96} y={258} tilt={-38} size={46} />
        <SceneLeaf x={110} y={258} tilt={8} size={36} />
        <SceneLeaf x={592} y={214} tilt={-14} size={34} />
        <SceneLeaf x={600} y={214} tilt={30} size={28} />
        <ellipse className="nf-pebble" cx="128" cy="262" rx="15" ry="6" />
        <ellipse className="nf-pebble" cx="356" cy="282" rx="8" ry="3.5" />
        <ellipse className="nf-pebble-dark" cx="452" cy="286" rx="7" ry="4" />
        <circle className="nf-pebble" cx="500" cy="270" r="2" />
        <circle className="nf-pebble" cx="300" cy="292" r="2" />

        {/* Pango's shadow, under where it stops. */}
        <ellipse className="nf-shadow" cx="236" cy="262" rx="56" ry="6" />
      </svg>

      {/* Pango, rolled up, on top of the picture: it rolls in and settles, facing the sign. */}
      <div className="nf-pango">
        <PangolinBall className="nf-ball" />
      </div>
    </div>
  );
}
