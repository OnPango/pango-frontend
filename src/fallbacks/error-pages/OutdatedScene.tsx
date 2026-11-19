import { ErrorScene, SceneLeaf } from './ErrorScene';

/** A four-pointed sparkle centered on (x, y), `r` units from its center to each tip. */
const sparkle = (x: number, y: number, r: number) => {
  const k = r * 0.28;
  return `M${x},${y - r} Q${x + k},${y - k} ${x + r},${y} Q${x + k},${y + k} ${x},${y + r} Q${x - k},${y + k} ${x - r},${y} Q${x - k},${y - k} ${x},${y - r} Z`;
};

/** The fade of the old trail. A single scene is on screen at a time. */
const OLD_TRAIL = 'es-old-trail';

/**
 * The picture of a new version: Pango rolls up to a fork. The old way goes on, fading and
 * overgrown; a fresh one climbs off, and the sign turns to point at it. Decoration only.
 */
export function OutdatedScene() {
  return (
    <ErrorScene pangoX={230} arrival="stop">
      <defs>
        <linearGradient id={OLD_TRAIL} gradientUnits="userSpaceOnUse" x1="330" x2="628">
          <stop className="es-trail-stop" offset="0" />
          <stop className="es-trail-stop" offset="1" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* The trail up to the fork, where it splits in two. */}
      <path className="es-trail" d="M40,262 C150,276 260,272 330,264" />

      {/* The old way: straight on and down, fading out, overgrown. */}
      <path
        className="es-trail-old"
        stroke={`url(#${OLD_TRAIL})`}
        d="M330,264 C390,268 470,284 628,288"
      />
      <SceneLeaf x={470} y={278} tilt={-24} size={26} soft />
      <SceneLeaf x={478} y={278} tilt={20} size={20} soft />
      <SceneLeaf x={566} y={285} tilt={-10} size={22} soft />
      <ellipse className="es-pebble-dark" cx="520" cy="282" rx="6" ry="3" />

      {/* The new way: climbing off to the right, fresh, with sprouts and sparkles. */}
      <path className="es-trail" d="M330,264 C370,262 392,224 440,216 C496,207 560,210 628,198" />
      <SceneLeaf x={492} y={210} tilt={-30} size={40} />
      <SceneLeaf x={502} y={210} tilt={14} size={30} />
      <SceneLeaf x={588} y={206} tilt={-18} size={50} soft />
      <SceneLeaf x={600} y={206} tilt={22} size={38} soft />
      <path className="es-spark es-spark-1" d={sparkle(450, 186, 12)} />
      <path className="es-spark es-spark-2" d={sparkle(540, 180, 9)} />
      <path className="es-spark es-spark-3" d={sparkle(616, 170, 11)} />

      {/* The sign at the fork, turning from the old way to the new one. */}
      <ellipse className="es-pebble" cx="372" cy="264" rx="18" ry="5" />
      <rect className="es-wood-dark" x="368" y="168" width="8" height="96" rx="3" />
      <g className="es-turn-sign">
        <path
          className="es-leaf"
          d="M352,174 H408 L420,186 L408,198 H352 Q346,198 346,192 V180 Q346,174 352,174 Z"
        />
        <path className="es-on-signal" d="M360,186 H396 M388,179 L396,186 L388,193" />
      </g>
      <circle className="es-metal-fill" cx="372" cy="186" r="2.5" />

      {/* Leaves and pebbles on this side. */}
      <SceneLeaf x={96} y={258} tilt={-38} size={46} />
      <SceneLeaf x={110} y={258} tilt={8} size={36} />
      <ellipse className="es-pebble" cx="128" cy="262" rx="15" ry="6" />
      <ellipse className="es-pebble" cx="300" cy="284" rx="8" ry="3.5" />
      <ellipse className="es-pebble-dark" cx="430" cy="282" rx="6" ry="3.5" />
      <circle className="es-pebble" cx="190" cy="290" r="2" />
    </ErrorScene>
  );
}
