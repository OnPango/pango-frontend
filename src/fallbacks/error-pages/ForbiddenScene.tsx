import { ErrorScene, SceneLeaf } from './ErrorScene';

/** A pointed fence board standing on the ground (y = 262), `width` wide, its tip at `top`. */
const board = (x: number, width: number, top: number) =>
  `M${x},262 V${top + 9} L${x + width / 2},${top} L${x + width},${top + 9} V262 Z`;

/** The two leaves of the gate, meeting in the middle at x = 472. */
const GATE_BOARDS = [413, 434, 455, 475, 496, 517];
/** The fence going on to the right of the gate. */
const FENCE_BOARDS = [562, 586, 610];

/**
 * The picture of the 403: Pango rolls up to a fenced garden, knocks into the gate and rolls back.
 * The gate is padlocked: the garden is there, but not for this role. Decoration only.
 */
export function ForbiddenScene() {
  return (
    <ErrorScene code="403" pangoX={322} arrival="bump">
      {/* The trail, up to the gate. */}
      <path className="es-trail" d="M40,262 C150,276 300,272 400,262" />

      {/* The garden on the other side: it exists, it is just closed. */}
      <ellipse className="es-pebble" cx="560" cy="262" rx="96" ry="7" />
      <SceneLeaf x={444} y={256} tilt={-22} size={92} soft />
      <SceneLeaf x={458} y={256} tilt={16} size={78} soft />
      <SceneLeaf x={506} y={256} tilt={-6} size={104} soft />
      <SceneLeaf x={576} y={256} tilt={-26} size={84} soft />
      <SceneLeaf x={590} y={256} tilt={22} size={96} soft />
      <SceneLeaf x={630} y={256} tilt={-12} size={64} soft />

      {/* The fence beyond the gate, and the gateposts. */}
      <rect className="es-wood-dark" x="556" y="206" width="84" height="7" rx="2" />
      <rect className="es-wood-dark" x="556" y="238" width="84" height="7" rx="2" />
      {FENCE_BOARDS.map((x) => (
        <path key={x} className="es-wood" d={board(x, 14, 186)} />
      ))}
      <rect className="es-wood-dark" x="394" y="164" width="16" height="98" rx="3" />
      <rect className="es-wood-dark" x="534" y="164" width="16" height="98" rx="3" />

      {/* The gate: two leaves, chained and padlocked in the middle. */}
      <g className="es-gate">
        {GATE_BOARDS.map((x) => (
          <path key={x} className="es-wood" d={board(x, 14, 178)} />
        ))}
        <rect className="es-wood-dark" x="408" y="198" width="128" height="8" rx="2" />
        <rect className="es-wood-dark" x="408" y="238" width="128" height="8" rx="2" />
        <path className="es-metal" d="M462,202 H482" />
      </g>
      <g className="es-padlock">
        <path className="es-metal" d="M463,214 V206 A9,9 0 0 1 481,206 V214" />
        <rect className="es-signal" x="457" y="211" width="30" height="26" rx="6" />
        <circle className="es-on-signal-fill" cx="472" cy="221" r="3.4" />
        <rect className="es-on-signal-fill" x="470.3" y="221" width="3.4" height="8" rx="1" />
      </g>

      {/* Leaves and pebbles on this side. */}
      <SceneLeaf x={96} y={258} tilt={-38} size={46} />
      <SceneLeaf x={110} y={258} tilt={8} size={36} />
      <ellipse className="es-pebble" cx="128" cy="262" rx="15" ry="6" />
      <ellipse className="es-pebble" cx="250" cy="284" rx="8" ry="3.5" />
      <ellipse className="es-pebble-dark" cx="372" cy="282" rx="6" ry="3.5" />
      <circle className="es-pebble" cx="190" cy="290" r="2" />
    </ErrorScene>
  );
}
