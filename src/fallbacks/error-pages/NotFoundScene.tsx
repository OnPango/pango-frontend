import { ErrorScene, SceneLeaf } from './ErrorScene';

/**
 * The picture of the 404: Pango rolls in along a winding trail and stops before a sign that says
 * the way ends here. Decoration only.
 */
export function NotFoundScene() {
  return (
    <ErrorScene code="404" pangoX={236} arrival="stop">
      {/* The trail, winding off towards the sign. */}
      <path
        className="es-trail"
        d="M40,262 C170,278 330,272 420,254 C482,241 474,222 424,220 C382,218 404,203 470,205 C502,206 524,210 548,214"
      />

      {/* The sign: the way ends here. */}
      <ellipse className="es-pebble" cx="560" cy="216" rx="20" ry="6" />
      <g className="es-dead-end">
        <rect className="es-wood-dark" x="556" y="150" width="8" height="66" rx="3" />
        <circle className="es-signal" cx="560" cy="148" r="21" />
        <path className="es-on-signal" d="M553,141 L567,155 M567,141 L553,155" />
      </g>

      {/* Leaves and pebbles along the way. */}
      <SceneLeaf x={96} y={258} tilt={-38} size={46} />
      <SceneLeaf x={110} y={258} tilt={8} size={36} />
      <SceneLeaf x={592} y={214} tilt={-14} size={34} />
      <SceneLeaf x={600} y={214} tilt={30} size={28} />
      <ellipse className="es-pebble" cx="128" cy="262" rx="15" ry="6" />
      <ellipse className="es-pebble" cx="356" cy="282" rx="8" ry="3.5" />
      <ellipse className="es-pebble-dark" cx="452" cy="286" rx="7" ry="4" />
      <circle className="es-pebble" cx="500" cy="270" r="2" />
      <circle className="es-pebble" cx="300" cy="292" r="2" />
    </ErrorScene>
  );
}
