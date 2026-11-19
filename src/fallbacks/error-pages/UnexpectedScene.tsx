import { ErrorScene, SceneLeaf } from './ErrorScene';

/** A plank of the bridge, seen from the side: centered on (x, y), tilted `tilt` degrees. */
function Plank({ x, y, tilt }: { x: number; y: number; tilt: number }) {
  return (
    <rect
      className="es-wood"
      x="-7"
      y="-3"
      width="14"
      height="6"
      rx="1.5"
      transform={`translate(${x} ${y}) rotate(${tilt})`}
    />
  );
}

/** The planks still on the bridge, sagging towards the break. [x, y, tilt] */
const LEFT_PLANKS = [
  [375, 263, 6],
  [391, 266, 10],
  [406, 269.6, 14],
  [421, 274, 17],
] as const;
const RIGHT_PLANKS = [
  [582, 263.5, -6],
  [567, 266, -10],
  [552, 269.4, -13],
  [538, 273.4, -16],
] as const;

/**
 * The picture of the unexpected error: the trail goes on, but the rope bridge over the ravine has
 * broken in the middle. Pango rolls up, stops at the edge and backs off; one more plank falls and a
 * loose one keeps swinging. The way exists: something broke on our side. Decoration only.
 */
export function UnexpectedScene() {
  return (
    <ErrorScene code="500" pangoX={262} arrival="bump">
      {/* The trail up to the ravine, and on the other side. */}
      <path className="es-trail" d="M40,262 C140,276 260,272 356,262" />
      <path className="es-trail" d="M604,262 C616,260 628,262 640,261" />
      <path
        className="es-ravine"
        d="M360,262 C376,268 380,296 410,298 L548,298 C578,296 584,268 600,262 Z"
      />

      {/* The far side, where the trail goes on. */}
      <SceneLeaf x={618} y={258} tilt={-20} size={56} soft />
      <SceneLeaf x={630} y={258} tilt={20} size={44} soft />

      {/* What is left of the bridge: the posts, the snapped ropes and the planks on them. */}
      <path className="es-rope" d="M355,200 C380,212 410,230 428,252" />
      <path className="es-rope" d="M603,200 C578,210 548,226 530,244" />
      <path className="es-rope es-rope-thin" d="M375,210 V263 M391,219 V266 M406,229 V269" />
      <path className="es-rope es-rope-thin" d="M582,209 V263 M567,216 V266 M552,226 V269" />
      <path className="es-rope" d="M360,262 C385,264 412,270 436,280" />
      <path className="es-rope" d="M598,262 C572,264 546,270 524,278" />
      {LEFT_PLANKS.map(([x, y, tilt]) => (
        <Plank key={x} x={x} y={y} tilt={tilt} />
      ))}
      {RIGHT_PLANKS.map(([x, y, tilt]) => (
        <Plank key={x} x={x} y={y} tilt={tilt} />
      ))}
      <rect className="es-wood-dark" x="350" y="194" width="10" height="72" rx="3" />
      <rect className="es-wood-dark" x="598" y="194" width="10" height="72" rx="3" />

      {/* A plank hanging from the break, swinging. */}
      <g className="es-loose-plank">
        <path className="es-rope es-rope-thin" d="M436,280 L437,287" />
        <Plank x={438} y={293} tilt={80} />
      </g>
      {/* The plank that gives way when Pango reaches the edge. */}
      <g className="es-falling-plank">
        <path className="es-rope es-rope-thin" d="M524,278 L520,284" />
        <Plank x={516} y={288} tilt={-55} />
      </g>

      {/* Leaves and pebbles on this side. */}
      <SceneLeaf x={96} y={258} tilt={-38} size={46} />
      <SceneLeaf x={110} y={258} tilt={8} size={36} />
      <ellipse className="es-pebble" cx="128" cy="262" rx="15" ry="6" />
      <ellipse className="es-pebble" cx="240" cy="284" rx="8" ry="3.5" />
      <ellipse className="es-pebble-dark" cx="336" cy="282" rx="5" ry="3" />
      <circle className="es-pebble" cx="186" cy="290" r="2" />
    </ErrorScene>
  );
}
